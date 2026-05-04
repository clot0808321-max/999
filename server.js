
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const file = {
  products: path.join(dataDir, 'products.json'),
  orders: path.join(dataDir, 'orders.json'),
  categories: path.join(dataDir, 'categories.json')
};

function ensure(f, fallback){ if(!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(fallback,null,2),'utf8'); }
ensure(file.products, []);
ensure(file.orders, []);
ensure(file.categories, []);

function read(f){ try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch(e){ return []; } }
function write(f,d){ fs.writeFileSync(f, JSON.stringify(d,null,2),'utf8'); }
function uid(prefix=''){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function orderNo(){
  const d=new Date();
  return `ORD${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${Math.floor(Math.random()*9000+1000)}`;
}
function isAdmin(req){ return !!(req.session && req.session.admin); }
function needAdmin(req,res,next){ if(isAdmin(req)) return next(); res.status(401).json({message:'未登入'}); }

app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({extended:true}));
app.use(session({
  secret: process.env.SESSION_SECRET || '999-shop-secret',
  resave:false,
  saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:'lax',maxAge:1000*60*60*8}
}));
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname,'public')));

// ✅ Railway 首頁修復：只新增，不影響原本 API / 後台 / TG 功能
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null,uploadDir),
  filename:(req,file,cb)=>cb(null,Date.now()+'-'+Math.random().toString(36).slice(2)+path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits:{fileSize:5*1024*1024},
  fileFilter:(req,file,cb)=> file.mimetype.startsWith('image/') ? cb(null,true) : cb(new Error('只允許圖片'))
});

async function sendTelegram(order){
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if(!token || !chatId) return {ok:false, skipped:true};
  const lines = [
    '🛒 999小店新訂單',
    `訂單編號：${order.id}`,
    `客戶：${order.customerName}`,
    `電話：${order.phone}`,
    `聯絡：${order.contact || '-'}`,
    `地址：${order.address}`,
    `付款方式：${order.paymentMethod || '-'}`,
    `總金額：$${Number(order.total).toFixed(2)}`,
    '',
    '商品明細：',
    ...order.items.map(i=>`・${i.name} x ${i.quantity} = $${(i.price*i.quantity).toFixed(2)}`),
    '',
    `備註：${order.note || '-'}`
  ];
  try{
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: lines.join('\n')
    });
    return {ok:true};
  }catch(e){
    console.error('TG通知失敗：', e.message);
    return {ok:false,error:e.message};
  }
}

app.get('/api/config',(req,res)=>{
  res.json({
    storeName:process.env.STORE_NAME||'999小店',
    phone:process.env.STORE_PHONE||'',
    line:process.env.STORE_LINE||'',
    telegram:process.env.STORE_TELEGRAM||'',
    whatsapp:process.env.STORE_WHATSAPP||'',
    payment:{
      usdtAddress:process.env.PAY_USDT_TRC20_ADDRESS||'',
      usdtNetwork:process.env.PAY_USDT_NETWORK||'TRC20',
      abaName:process.env.PAY_ABA_ACCOUNT_NAME||'',
      abaNumber:process.env.PAY_ABA_ACCOUNT_NUMBER||'',
      abaQr:process.env.PAY_ABA_QR_IMAGE||'',
      cashNote:process.env.PAY_CASH_NOTE||''
    }
  });
});

app.get('/api/categories',(req,res)=>res.json(read(file.categories)));

app.get('/api/products',(req,res)=>{
  let list = read(file.products);
  if(req.query.admin !== '1') list = list.filter(p=>p.active !== false);
  if(req.query.category) list = list.filter(p=>p.category === req.query.category);
  if(req.query.q){
    const q = req.query.q.toLowerCase();
    list = list.filter(p=>(p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  }
  res.json(list);
});
app.get('/api/products/:id',(req,res)=>{
  const p=read(file.products).find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({message:'找不到商品'});
  res.json(p);
});
app.post('/api/products',needAdmin,(req,res)=>{
  const list=read(file.products);
  const p={...req.body,id:uid('p_'),price:Number(req.body.price||0),stock:Number(req.body.stock||0),active:req.body.active===true||req.body.active==='true'||req.body.active==='on',featured:req.body.featured===true||req.body.featured==='true'||req.body.featured==='on',createdAt:new Date().toISOString()};
  list.unshift(p); write(file.products,list); res.json(p);
});
app.put('/api/products/:id',needAdmin,(req,res)=>{
  const list=read(file.products); const idx=list.findIndex(x=>x.id===req.params.id);
  if(idx<0) return res.status(404).json({message:'找不到商品'});
  const p={...list[idx],...req.body};
  p.price=Number(p.price||0); p.stock=Number(p.stock||0);
  p.active=p.active===true||p.active==='true'||p.active==='on';
  p.featured=p.featured===true||p.featured==='true'||p.featured==='on';
  list[idx]=p; write(file.products,list); res.json(p);
});
app.delete('/api/products/:id',needAdmin,(req,res)=>{
  write(file.products, read(file.products).filter(x=>x.id!==req.params.id));
  res.json({ok:true});
});

app.post('/api/upload',needAdmin,upload.single('image'),(req,res)=>{
  if(!req.file) return res.status(400).json({message:'沒有圖片'});
  res.json({url:'/uploads/'+req.file.filename});
});

app.get('/api/orders',needAdmin,(req,res)=>res.json(read(file.orders)));
app.get('/api/orders/:id',(req,res)=>{
  const order=read(file.orders).find(o=>o.id===req.params.id);
  if(!order) return res.status(404).json({message:'找不到訂單'});
  res.json({id:order.id,status:order.status,total:order.total,createdAt:order.createdAt,items:order.items});
});
app.post('/api/orders',async (req,res)=>{
  const products=read(file.products), orders=read(file.orders);
  const body=req.body;
  if(!body.items || !body.items.length) return res.status(400).json({message:'購物車是空的'});
  const items=[]; let total=0;
  for(const item of body.items){
    const p=products.find(x=>x.id===item.productId && x.active!==false);
    if(!p) return res.status(400).json({message:'商品不存在或已下架'});
    const qty=Math.max(1,Number(item.quantity||1));
    if(Number(p.stock)<qty) return res.status(400).json({message:`${p.name} 庫存不足`});
    p.stock=Number(p.stock)-qty;
    items.push({productId:p.id,name:p.name,price:Number(p.price),quantity:qty});
    total += Number(p.price)*qty;
  }
  const order={
    id:orderNo(),
    customerName:body.customerName||'',
    phone:body.phone||'',
    contact:body.contact||'',
    address:body.address||'',
    note:body.note||'',
    paymentMethod:body.paymentMethod||'客服確認',
    items,
    total:Math.round(total*100)/100,
    status:'新訂單',
    paid:false,
    createdAt:new Date().toISOString()
  };
  orders.unshift(order);
  write(file.products,products);
  write(file.orders,orders);
  const tg = await sendTelegram(order);
  res.json({...order, telegram:tg});
});
app.put('/api/orders/:id/status',needAdmin,(req,res)=>{
  const orders=read(file.orders); const o=orders.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({message:'找不到訂單'});
  o.status=req.body.status||o.status;
  if(typeof req.body.paid !== 'undefined') o.paid=!!req.body.paid;
  write(file.orders,orders); res.json(o);
});

app.post('/api/admin/login',(req,res)=>{
  if(req.body.username===(process.env.ADMIN_USERNAME||'admin') && req.body.password===(process.env.ADMIN_PASSWORD||'123456')){
    req.session.admin={username:req.body.username}; return res.json({ok:true});
  }
  res.status(401).json({message:'帳號或密碼錯誤'});
});
app.get('/api/admin/check',(req,res)=>res.json({loggedIn:isAdmin(req)}));
app.post('/api/admin/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));

app.listen(PORT,()=>console.log(`999小店 PRO 升級版已啟動：http://localhost:${PORT}`));
