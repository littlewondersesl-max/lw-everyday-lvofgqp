/* Animal Memory, Match the object, Match the pet to its home, What should Max wear?: instructions, feedback and interface labels.
   The animal names, object names and clothing choices (the things being practised) stay English-only. */
LWLang.add({
'Well done!':'做得好！','Play again':'再玩一次',
// Animal Memory
'Animal Memory':'动物记忆','Tap the star to start!':'点一下星星开始！','New game':'新游戏','Same sequence grows':'同一串，越来越长','New sequence every level':'每一关都是新的顺序',
'Tap the star to start or hear it again. The last 3 animals always play at normal speed.':'点一下星星开始，或者再听一遍。最后 3 个动物总是用正常速度播放。',
'Watch and listen…':'看一看，听一听…','Your turn!':'轮到你了！','Great!':'太棒了！','Try again':'再试一次','Well done!You remembered all 14!':'做得好！你记住了全部 14 个！',
'normal speed':'正常速度','steady':'稳定速度',
// Match the object / pet
'Match the object':'配对物品','Draw a line to join each object to its partner.':'画线把每个物品和它的搭档连起来。','Every object has a match!':'每个物品都找到了搭档！',
'Match the pet to its home':'给宠物找到它的家','Draw a line from each pet to its home.':'画线把每只宠物连到它的家。','Every pet is home!':'每只宠物都回家了！',
// What should Max wear?
'What should Max wear?':'Max 该穿什么？','Next ▶':'下一个','Max is ready for every weather.':'Max 已经为各种天气做好了准备。',
'Teacher: press play, ask "What\'s the weather like?", then let the children choose.':'老师：按播放键，问“今天天气怎么样？”，然后让孩子们来选。',
'It is rainy. What should Max wear?':'下雨了。Max 该穿什么？','It is snowy. What should Max wear?':'下雪了。Max 该穿什么？','It is sunny. What should Max wear?':'天气晴朗。Max 该穿什么？',
'It is rainy, so Max wears his raincoat.':'下雨了，所以 Max 穿上了雨衣。','It is snowy, so Max wears his coat, scarf and hat.':'下雪了，所以 Max 穿上了外套，围上围巾，戴上帽子。','It is sunny, so Max wears his T-shirt and sunglasses.':'天气晴朗，所以 Max 穿上了 T 恤，戴上了太阳镜。',
'Brrr! Max is cold!':'哆嗦哆嗦！Max 觉得冷！','Brrr! Max is very cold!':'哆嗦哆嗦！Max 觉得非常冷！','Huh? There is no rain!':'咦？没有下雨呀！','Oh no! Max is all wet!':'哎呀！Max 全身都湿了！','Phew! Max is too hot!':'呼——Max 太热了！'
});
LWLang.addRe([
 [/^Level (\d+) \/ (\d+)$/,function(m){return '第 '+m[1]+' 关 / 共 '+m[2]+' 关'}],
 [/^([\d.]+)× faster$/,function(m){return '快 '+m[1]+' 倍'}],
 [/^Pip's Little Wonders · (Everyday Objects|Everyday Animals|Everyday Weather)$/,function(m){return 'Pip 的小小奇迹 · '+{'Everyday Objects':'日常物品','Everyday Animals':'日常动物','Everyday Weather':'日常天气'}[m[1]]}]
]);
