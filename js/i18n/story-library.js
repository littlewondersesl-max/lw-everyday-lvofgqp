/* Story Library: interface labels, Jack and the Beanstalk page translations and word-card definitions. */
(function(){
LWLang.add({
'Welcome, reader':'欢迎，小读者','Choose who you are today. Then walk inside.':'选一选今天你是谁，然后走进图书馆吧。',
'Change reader':'换一位读者','I read':'我来读','Librarian reads':'图书管理员读','Shall I read to you?':'要我读给你听吗？',
'Today’s shelf':'今天的书架','Reading mode':'阅读方式','← Library':'返回图书馆','Previous page':'上一页','Next page':'下一页',
'Word card':'单词卡','Keep reading':'继续读','Close picture':'关闭图片','Coming soon':'敬请期待',
'Jack and the Beanstalk':'杰克与豌豆','The Three Little Pigs':'三只小猪','Goldilocks':'金发姑娘','The Gingerbread Man':'姜饼人','The Tortoise and the Hare':'龟兔赛跑','Little Red Riding Hood':'小红帽','Hansel and Gretel':'汉赛尔与格莱特','The Ugly Duckling':'丑小鸭','The Lion and the Mouse':'狮子和老鼠','Puss in Boots':'穿靴子的猫',
// word-card definitions
'having little money':'穷的：没有多少钱','a place people go to buy and sell':'市场：人们去买东西、卖东西的地方','able to do things that are not normal':'魔法的：能做出不平常的事','to put something in the ground so it can grow':'种：把东西放进土里让它长大','a very tall plant that beans grow on':'豆茎：豆子长在上面的很高很高的植物','to go up using your hands and feet':'爬：用手和脚往上走','a person who is much, much bigger than other people':'巨人：比别人大得多得多的人','to go where no one can see you':'躲藏：去别人看不到你的地方','a shiny yellow metal that is worth a lot':'黄金：闪闪发光、很值钱的黄色金属','a female chicken':'母鸡：雌性的鸡','a tall instrument with strings that you play with your fingers':'竖琴：有琴弦、用手指弹奏的高高的乐器','a tool with a sharp blade, used to cut wood':'斧头：有锋利刀刃、用来砍木头的工具','the loud sound some people make when they sleep':'打呼噜：有些人睡觉时发出的很响的声音','the soft white or grey things in the sky':'云：天空中软软的白色或灰色的东西',
// art captions
'A little house at the edge of town':'镇边的一座小房子','Jack walks Milky-White down the road':'杰克牵着“小白”走在路上','Magic beans shining like little lights':'像小灯一样闪闪发光的魔法豆','Beans thrown into the dark garden':'豆子被扔进黑漆漆的花园','A beanstalk up through the clouds':'穿过云层的豆茎','The giant’s great kitchen':'巨人的大厨房','The giant counts his gold':'巨人在数他的金子','The hen that lays a golden egg':'会下金蛋的母鸡','Jack runs with the golden harp':'杰克抱着金竖琴跑','Home, safe and together':'回到家，平安又团聚'
});
LWLang.addRe([[/^Page (\d+) of (\d+)$/,function(m){return '第 '+m[1]+' 页，共 '+m[2]+' 页'}]]);
var PAGES=window.LW_STORY_ZH||[];
function zhOn(){return window.LWLang&&LWLang.zh}
function build(){
 var nav=document.querySelector('.book-room'); if(!nav||document.getElementById('lw-zhbtn'))return;
 var b=document.createElement('button');b.type='button';b.id='lw-zhbtn';b.className='chip-btn';b.textContent='中文翻译';b.setAttribute('data-lw-skip','');b.hidden=true;nav.appendChild(b);
 var p=document.createElement('div');p.id='lw-zhpanel';p.setAttribute('data-lw-skip','');p.hidden=true;
 p.innerHTML='<div class="zh-card"><button type="button" class="zh-x" aria-label="Close">×</button><h3></h3><div class="zh-body"></div></div>';
 document.body.appendChild(p);
 var st=document.createElement('style');st.textContent='#lw-zhbtn{position:absolute;right:18px;top:52px;z-index:5;min-height:30px;padding:4px 12px;font-size:13px;white-space:nowrap}.book-room{position:relative}#lw-zhpanel{position:fixed;left:0;right:0;bottom:0;top:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(10,20,12,.55);padding:14px}#lw-zhpanel[hidden]{display:none}#lw-zhpanel .zh-card{position:relative;background:#f6ecd4;color:#2a2118;border-radius:14px;padding:18px 20px;max-width:620px;width:100%;max-height:82vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.45);font-size:17px;line-height:1.7}#lw-zhpanel h3{margin:0 30px 8px 0;font:700 16px/1.3 Nunito,sans-serif;color:#2f5d3a}#lw-zhpanel .zh-body p{margin:0 0 .8em}#lw-zhpanel .zh-x{position:absolute;right:8px;top:6px;border:0;background:none;font-size:28px;line-height:1;cursor:pointer;color:#2a2118}';
 document.head.appendChild(st);
 function show(){var n=(document.getElementById('page-progress').textContent.match(/(\d+)/)||[0,1])[1]|0;
  p.querySelector('h3').textContent='第 '+n+' 页 · 中文翻译';
  p.querySelector('.zh-body').innerHTML=(PAGES[n-1]||'').split('\n\n').map(function(t){return '<p>'+t.replace(/\n/g,'<br>')+'</p>'}).join('');
  p.hidden=false}
 b.addEventListener('click',show);
 p.addEventListener('click',function(e){if(e.target===p||e.target.className==='zh-x')p.hidden=true});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')p.hidden=true});
 function sync(){b.hidden=!zhOn();if(!zhOn())p.hidden=true}
 LWLang.on(sync);sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
