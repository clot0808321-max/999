
const money=n=>`$${Number(n||0).toFixed(2)}`;
const cartKey='999_cart';
function getCart(){return JSON.parse(localStorage.getItem(cartKey)||'[]')}
function saveCart(c){localStorage.setItem(cartKey,JSON.stringify(c));countCart()}
function countCart(){document.querySelectorAll('[data-cart]').forEach(e=>e.textContent=getCart().reduce((s,i)=>s+Number(i.quantity||0),0))}
async function api(u,o){const r=await fetch(u,o); if(!r.ok) throw new Error((await r.json()).message||'錯誤'); return r.json()}
function icon(c){return {'飲料區':'🥤','台灣酒類':'🍶','香煙區':'🚬','冷凍食品區':'❄️','濾嘴區':'🌬️','盤子／隨身盤':'💽','生活用品區':'🧻','泡麵、麵食區':'🍜','藥品區':'💊','調味品、罐頭區':'🥫','餅乾區':'🍪','拜拜金紙區':'🧧'}[c]||'🛒'}
function addCart(p,q=1){let c=getCart();let f=c.find(x=>x.productId===p.id); if(f) f.quantity+=Number(q); else c.push({productId:p.id,name:p.name,price:p.price,category:p.category,image:p.image,quantity:Number(q)}); saveCart(c); alert('已加入購物車')}
function header(){
document.getElementById('siteHeader').innerHTML=`<div class="top"><div class="container"><div>柬埔寨台灣商品・零食・生活用品代購</div><div><a href="track.html">訂單查詢</a>　<a href="/admin/login.html">會員登入</a>　<a class="cart" href="cart.html">購物車 <span data-cart>0</span></a></div></div></div><div class="head"><div class="container"><a class="brand" href="index.html"><div class="logo">999</div><div><h1>999小店</h1><p>TAIWAN SNACKS IN CAMBODIA</p></div></a><form class="search" action="products.html"><input name="q" placeholder="搜尋商品：鳳梨酥、泡麵、飲料、餅乾..."><button class="btn">搜尋</button></form></div></div><nav class="nav"><div class="container"><a href="index.html">回首頁</a><a href="index.html#about">關於我們</a><a href="index.html#news">最新消息</a><a href="products.html">購買商品</a><a href="index.html#catalog">商品目錄</a><a href="index.html#guide">購物說明</a><a href="/admin/login.html">會員專區</a><a href="index.html#contact">聯絡我們</a></div></nav>`; countCart()
}
function footer(){document.getElementById('siteFooter').innerHTML=`<div class="footer"><div class="container"><h2>999小店</h2><p>LINE：@999shop　Telegram：@999shop　WhatsApp：+855 000 000 000</p><p>下單後客服會確認付款方式與配送時間。</p></div></div>`}
document.addEventListener('DOMContentLoaded',()=>{header();footer();countCart()})
