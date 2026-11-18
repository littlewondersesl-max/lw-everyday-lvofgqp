/* Jack and the Beanstalk text pages: interface labels and a Chinese translation panel under the English text (shown only in EN+中文). */
(function(){
LWLang.add({'← Home':'返回首页','Jack and the Beanstalk':'杰克与豌豆','Original text (Jacobs, 1890)':'原文（雅各布斯，1890 年）','Easy English (short lines)':'简易英语（短句版）','Easy English (story prose)':'简易英语（故事版）'});
var EASY=[
['杰克和妈妈住在一起。','他们很穷。','他们只有一头牛。','它的名字叫小白。'],
['牛每天都产奶。','杰克卖牛奶。','他们就是这样得到食物的。'],
['有一天早上，牛不产奶了。','“我们该怎么办？”妈妈说。','“我去把牛卖掉，”杰克说。'],
['杰克牵着牛去镇上。','路上他遇到一位老爷爷。','“早上好，杰克，”老爷爷说。','“你怎么知道我的名字？”杰克说。'],
['“我知道很多事，”老爷爷说。','“我用这些豆子换你的牛。','它们是魔法豆。','晚上把它们种下。','到早上它们就会长到天上去。”'],
['杰克看着豆子。','它们有红的、绿的、金色的。','“好，”杰克说。','他把牛交给了老人。','他把豆子放进口袋里。'],
['杰克跑回家。','“你把牛卖了吗？”妈妈说。','“卖了！”杰克说。“我换回了这些魔法豆！”','妈妈不高兴了。','“豆子？杰克，我们需要钱，不是豆子！”','她把豆子从窗户扔了出去。','“去睡觉吧，”她说。','杰克没吃晚饭就上床了。'],
['早上，杰克醒来了。','他的房间很暗。','他往窗外看。','一株巨大的豆茎在那里！','它向上、向上、再向上。','一直伸进云里。'],
['杰克打开窗户。','他跳上了豆茎。','它像一架高高的绿梯子。','杰克爬呀爬呀爬。','他一直爬到天上。'],
['顶上有一条长长的路。','杰克走啊走。','他来到一座很大很大的房子前。','一位高个子女人站在门口。'],
['“求求你，我很饿，”杰克说。','“走开，”女人说。','“我丈夫是个巨人。','他爱吃男孩。”','“求求你，”杰克说。“我没有吃的。”','那女人心地很好。','她给了杰克面包和牛奶。'],
['咚。咚。咚。','房子在晃动。','“快躲起来！”女人说。','杰克躲进一口大锅里。','巨人走了进来。'],
['巨人个子好大。','他吸了吸鼻子。','“呸呸呸呸！','我闻到一个男孩。','我闻到一个小家伙！”','“没有，没有，”他的妻子说。','“你闻到的是你的早饭。','坐下吃吧。”'],
['巨人吃啊吃啊吃。','然后他拿出一袋金子。','他数着金子。','他的眼睛闭上了。','他打起了呼噜。','房子又晃了起来。'],
['杰克从锅里出来了。','他非常安静。','他拿起那袋金子。','他跑向豆茎。','他往下爬、往下爬、再往下爬。'],
['“妈妈！快看！”杰克说。','他把金子给妈妈看。','“那些豆子真的是魔法豆！”','他们买了食物。','他们高兴了一阵子。','后来金子用完了。'],
['杰克又爬上了豆茎。','他来到那座大房子。','他躲进锅里。','咚。咚。咚。','“呸呸呸呸！”巨人说。','“我闻到一个男孩！”','“吃你的早饭吧，”他的妻子说。'],
['早饭以后，巨人说：','“把我的母鸡拿来。”','母鸡是棕色的，胖胖的。','“下蛋！”巨人说。','母鸡下了一个蛋。','蛋是金的！'],
['巨人睡着了。','杰克拿起母鸡。','母鸡叫起来：“咯咯！咯咯！”','巨人醒了。','“我的母鸡！我的母鸡！”','杰克跑啊跑。','他飞快地顺着豆茎爬下去。'],
['现在杰克和妈妈有了一只魔法母鸡。','杰克每天说：“下蛋！”','母鸡每天下一个金蛋。','可是杰克还想再看一次天上的世界。'],
['杰克又爬上了豆茎。','这一次他躲进一个大箱子里。','咚。咚。咚。','“呸呸呸呸！','我闻到一个男孩！','我知道我没闻错！”','巨人往锅里看。','杰克不在那儿。'],
['“把我的竖琴拿来，”巨人说。','竖琴是金色的。','“唱！”巨人说。','竖琴唱出一首甜美的歌。','巨人笑了。','不一会儿他就睡着了。'],
['杰克拿起竖琴。','竖琴大叫：“救命！救命！”','巨人睁开了眼睛。','“站住，小子！”','杰克跑啊跑。','巨人在后面追他。'],
['杰克跑到了豆茎边。','他飞快地爬下去。','巨人也爬了下来。','豆茎晃动起来。','“妈妈！把斧头拿来！”杰克说。'],
['妈妈拿着斧头跑来了。','杰克砍豆茎。','咔嚓！','咔嚓！','豆茎倒了。','巨人往下掉、往下掉、再往下掉。','他再也没有回来。'],
['杰克有了金竖琴。','杰克有了魔法母鸡。','杰克有了妈妈。','他们不再穷了。','他们平安了。','他们很快乐。']
];
var WORDS='要学的单词：poor 穷 · sell 卖 · magic 魔法 · plant 种 · climb 爬 · giant 巨人 · hide 躲藏 · gold 黄金 · hen 母鸡 · egg 蛋 · harp 竖琴 · axe 斧头 · safe 安全 · happy 快乐';
function panel(title,html){
 var pre=document.querySelector('pre');if(!pre)return;
 var d=document.createElement('details');d.id='lw-zhtext';d.setAttribute('data-lw-skip','');d.hidden=true;
 d.innerHTML='<summary>'+title+'（点开阅读）</summary>'+html;
 var st=document.createElement('style');st.textContent='#lw-zhtext{margin:18px 0;padding:14px 18px;background:#fff8e6;border:2px solid #e8d5ae;border-radius:14px;font:17px/1.8 "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;color:#2a2118;max-width:760px}#lw-zhtext[hidden]{display:none}#lw-zhtext summary{cursor:pointer;font-weight:800;font-size:16px;color:#6c4ea0;margin:0 0 8px}#lw-zhtext p{margin:0 0 .75em}#lw-zhtext h4{margin:1em 0 .2em;font-size:15px;color:#2f6f6f}@media print{#lw-zhtext{display:none}}';
 document.head.appendChild(st);pre.parentNode.insertBefore(d,pre);
 function sync(){d.hidden=!LWLang.zh}LWLang.on(sync);sync();
}
var cs=document.createElement('style');cs.textContent='html.lw-has body.textpage>div:first-child{padding-right:178px;box-sizing:border-box}@media(max-width:520px){html.lw-has body.textpage>div:first-child{padding-right:0;padding-top:44px}}';document.head.appendChild(cs);
function build(){
 var h2=(document.querySelector('h2')||{}).textContent||'';
 if(/short lines/.test(h2)){
  var h='';EASY.forEach(function(p,i){h+='<h4>第 '+(i+1)+' 页</h4><p>'+p.join('<br>')+'</p>'});
  h+='<p>故事结束。</p><p>'+WORDS+'</p>';
  panel('中文翻译',h);
 }else if(/story prose/.test(h2)){
  var P=window.LW_STORY_ZH||[];
  panel('中文翻译',P.map(function(t){return t.split('\n\n').map(function(q){return '<p>'+q.replace(/\n/g,'<br>')+'</p>'}).join('')}).join('')+'<p>故事结束。</p>');
 }else{
  panel('说明','<p>这是 1890 年雅各布斯收集整理的《杰克与豌豆》原文，用的是旧式英语，所以这一页保持英文原样。想读中文，请打开“简易英语”的两个版本。</p>');
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
