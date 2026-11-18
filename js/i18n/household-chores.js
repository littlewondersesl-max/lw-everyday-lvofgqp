/* Household Chores (picture-word stories): menus, instructions, chapter titles and the picture names. The story sentences and the memory-card words stay English-only. */
LWLang.add({
'Picture-word stories':'图文故事','Daily activities':'日常活动','Stories':'故事','Mom':'妈妈','Dad':'爸爸','Household Chores':'家务活','Handyman Work':'修修补补',
'Follow Mom through her day.':'跟着妈妈度过她的一天。','Follow Dad as he fixes and gardens.':'跟着爸爸一起修东西、做园艺。','Chapters':'章节',
'Mom’s Morning':'妈妈的早晨','Bed, kitchen, and plants · 5 of 15 pictures':'床、厨房和植物 · 15 张图片中的 5 张','A Sparkling House':'闪闪发亮的家','Dust, floors, and fresh air · 5 of 15 pictures':'灰尘、地板和新鲜空气 · 15 张图片中的 5 张',
'Wash Day':'洗衣日','Clothes, shine, and a clean tub · 5 of 15 pictures':'衣服、闪亮和干净的浴缸 · 15 张图片中的 5 张',
'Fix-it Morning':'修理的早晨','Ladder, tools, and a tight pipe · 5 of 15 pictures':'梯子、工具和一根拧紧的水管 · 15 张图片中的 5 张','Garden Day':'园艺日','Hose, hedges, and a fixed fence · 5 of 15 pictures':'水管、树篱和修好的栅栏 · 15 张图片中的 5 张',
'Build and Paint':'搭建和粉刷','Brush, saw, and a bright bulb · 5 of 15 pictures':'刷子、锯子和一个明亮的灯泡 · 15 张图片中的 5 张',
'Memory cards':'记忆卡片','Match the picture words you found in the stories.':'把你在故事里找到的图片词语配成一对。','Play':'开始玩','Find the pictures':'找一找图片','Open the big picture and tap every hidden chore.':'打开大图，点一点每一件藏起来的家务。','Open':'打开','Start':'开始',
'Pictures':'图片','Look at the picture, read the sentence, then drag the matching item from the left into the box under the word.':'看一看图片，读一读句子，然后把左边对应的东西拖到单词下面的格子里。','Drop the picture here':'把图片放在这里',
'Levels':'级别','Picture deck':'图片卡组','Tap every hidden chore':'点一点每一件藏起来的家务',
'Counter':'台面','Watering Can':'洒水壶','Bed':'床','Stove':'炉灶','Dishes':'碗碟','Duster':'掸子','Mop':'拖把','Window':'窗户','Vacuum':'吸尘器','Broom':'扫帚','Trash':'垃圾','Iron':'熨斗','Clothes':'衣服','Washing Machine':'洗衣机','Bathtub':'浴缸',
'Hammer':'锤子','Wrench':'扳手','Toolbox':'工具箱','Ladder':'梯子','Screwdriver':'螺丝刀','Fence':'栅栏','Hose':'水管','Rake':'耙子','Wheelbarrow':'独轮车','Shears':'修枝剪','Saw':'锯子','Drill':'电钻','Paintbrush':'画笔','Bulb':'灯泡','Nails':'钉子'
});
LWLang.addRe([
 [/^(\d+) of (\d+) found$/,function(m){return '找到了 '+m[1]+' / '+m[2]}],
 [/^(\d+) of (\d+) pictures · chapter (\d+) of (\d+)$/,function(m){return '第 '+m[3]+' 章，共 '+m[4]+' 章 · 已完成 '+m[1]+' / '+m[2]+' 张图片'}],
 [/^Chapter (\d+) of (\d+)$/,function(m){return '第 '+m[1]+' 章，共 '+m[2]+' 章'}],
 [/^Level (\d)$/,function(m){return '第 '+m[1]+' 级'}],
 [/^(\d+) cards$/,function(m){return m[1]+' 张卡片'}],
 [/^Memory · (\d+) cards$/,function(m){return '记忆游戏 · '+m[1]+' 张卡片'}]
]);
