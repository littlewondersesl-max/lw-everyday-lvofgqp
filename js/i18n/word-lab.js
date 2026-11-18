/* Word Lab: topic titles, one-line descriptions, subject tabs and page labels. */
(function(){
var T={
'Acids and bases':['酸和碱','酸酸的、滑滑的，还有 pH 值'],'Atoms and elements':['原子和元素','组成万物的小小颗粒'],'Carbon':['碳','从铅笔到钻石'],'Chemical reactions':['化学反应','物质发生变化的时候'],'Metals':['金属','闪亮、坚固、很有用'],'Mixtures and solutions':['混合物和溶液','物质混在一起的时候'],'Separating mixtures':['分离混合物','过滤、蒸发，还有更多方法'],'States of matter':['物质的状态','固体、液体和气体'],'The periodic table':['元素周期表','元素的地图'],'Why iron rusts':['铁为什么会生锈','氧气、水和金属'],
'Forces and gravity':['力和重力','推、拉和掉下来的东西'],'Light and shadows':['光和影子','光是怎样传播的'],'Sound and vibrations':['声音和振动','我们是怎样听到声音的'],'Electricity and circuits':['电和电路','电池、电线和灯泡'],'Magnets':['磁铁','推、拉和指南针'],'Energy':['能量','能量的种类和来源'],'The Solar System':['太阳系','太阳和它的行星'],'Heat and temperature':['热和温度','热是怎样传递的'],'Simple machines':['简单机械','让工作更轻松'],'How scientists work':['科学家怎样工作','提问、实验和结果'],
'Cells':['细胞','生命的基本单位'],'The human skeleton':['人体骨骼','骨头、关节和肌肉'],'The heart and blood':['心脏和血液','你体内的水泵'],'Photosynthesis':['光合作用','植物怎样制造食物'],'The digestive system':['消化系统','食物的旅行'],'Food chains':['食物链','谁吃谁'],'Life cycle of a butterfly':['蝴蝶的一生','变化的四个阶段'],'The five senses':['五种感觉','我们怎样认识世界'],'Germs and staying healthy':['细菌和保持健康','怎样阻止细菌'],'Animal adaptations':['动物的适应','在栖息地里生存'],
'Continents and oceans':['大洲和大洋','我们星球上的大块形状'],'The water cycle':['水循环','水怎样在地球上旅行'],'Volcanoes':['火山','来自地球内部的火'],'Earthquakes':['地震','大地摇晃的时候'],'Rivers':['河流','从源头到大海'],'Weather and climate':['天气和气候','今天，还有很多年里'],'Deserts':['沙漠','又热、又冷、非常干燥的地方'],'Mountains':['山','地球上的高处'],'Rainforests':['雨林','温暖潮湿的森林'],'Reading maps':['看地图','符号、比例尺和方向'],
'Ancient Egypt':['古埃及','法老、金字塔和尼罗河'],'Ancient Greece':['古希腊','民主和第一届奥运会'],'The Roman Empire':['罗马帝国','道路、士兵和斗兽场'],'The Stone Age':['石器时代','猎人、火和洞穴壁画'],'The Vikings':['维京人','来自北方的航海家'],'Medieval castles':['中世纪城堡','护城河、塔楼和吊桥'],'The Silk Road':['丝绸之路','贸易和思想交流之路'],'The printing press':['印刷机','让人人都有书读'],'The Industrial Revolution':['工业革命','机器改变世界'],'The first steps on the Moon':['登上月球的第一步','1969 年阿波罗 11 号任务']};
var SUB={Chemistry:'化学',Science:'科学',Biology:'生物',Geography:'地理',History:'历史'};
var M={'Word Lab':'词汇实验室','Open the sheet (PDF)':'打开练习页（PDF）','Answer key (PDF)':'答案（PDF）',
'Matter, reactions and the periodic table. Ten one-page sheets with brain teasers, a cool fact, a word hunt and speaking questions.':'物质、反应和元素周期表。十张单页练习，有脑筋急转弯、一个有趣的小知识、找单词和口语问题。',
'Forces, light, sound, energy and how scientists work. Ten one-page sheets with brain teasers, a cool fact, a word hunt and speaking questions.':'力、光、声音、能量，还有科学家怎样工作。十张单页练习，有脑筋急转弯、一个有趣的小知识、找单词和口语问题。',
'Living things, the human body and how life works. Ten one-page sheets with brain teasers, a cool fact, a word hunt and speaking questions.':'生物、人体，还有生命是怎样运转的。十张单页练习，有脑筋急转弯、一个有趣的小知识、找单词和口语问题。',
'Our planet: land, water, weather and maps. Ten one-page sheets with brain teasers, a cool fact, a word hunt and speaking questions.':'我们的星球：陆地、水、天气和地图。十张单页练习，有脑筋急转弯、一个有趣的小知识、找单词和口语问题。',
'People and events from the Stone Age to the Moon. Ten one-page sheets with brain teasers, a cool fact, a word hunt and speaking questions.':'从石器时代到登月的人物和大事。十张单页练习，有脑筋急转弯、一个有趣的小知识、找单词和口语问题。',
'One page, A4 landscape. Print it or work from the screen.':'一页，A4 横版。可以打印，也可以在屏幕上做。'};
for(var k in T){M[k]=T[k][0]}
// descriptions: stored under their own English text
LWLang.add(M);
// descriptions come from the page, so register them by English text below
LWLang.add({"Sour, slippery and the pH scale": "酸酸的、滑滑的，还有 pH 值", "The tiny pieces of everything": "组成万物的小小颗粒", "From pencils to diamonds": "从铅笔到钻石", "When substances change": "物质发生变化的时候", "Shiny, strong and useful": "闪亮、坚固、很有用", "When substances mix together": "物质混在一起的时候", "Filter, evaporate and more": "过滤、蒸发，还有更多方法", "Solid, liquid and gas": "固体、液体和气体", "A map of the elements": "元素的地图", "Oxygen, water and metal": "氧气、水和金属", "Pushes, pulls and falling things": "推、拉和掉下来的东西", "How light travels": "光是怎样传播的", "How we hear": "我们是怎样听到声音的", "Batteries, wires and bulbs": "电池、电线和灯泡", "Push, pull and the compass": "推、拉和指南针", "Forms of energy and where it comes from": "能量的种类和来源", "The Sun and its planets": "太阳和它的行星", "How heat moves": "热是怎样传递的", "Making work easier": "让工作更轻松", "Questions, experiments and results": "提问、实验和结果", "The building blocks of life": "生命的基本单位", "Bones, joints and muscles": "骨头、关节和肌肉", "The pump inside you": "你体内的水泵", "How plants make food": "植物怎样制造食物", "The journey of your food": "食物的旅行", "Who eats what": "谁吃谁", "Four stages of change": "变化的四个阶段", "How we know the world": "我们怎样认识世界", "How to stop germs": "怎样阻止细菌", "Surviving in a habitat": "在栖息地里生存", "The big shapes of our planet": "我们星球上的大块形状", "How water travels around Earth": "水怎样在地球上旅行", "Fire from inside Earth": "来自地球内部的火", "When the ground shakes": "大地摇晃的时候", "From the source to the sea": "从源头到大海", "Today and over many years": "今天，还有很多年里", "Hot, cold and very dry places": "又热、又冷、非常干燥的地方", "High places on Earth": "地球上的高处", "The warm, wet forests": "温暖潮湿的森林", "Symbols, scale and directions": "符号、比例尺和方向", "Pharaohs, pyramids and the Nile": "法老、金字塔和尼罗河", "Democracy and the first Olympic Games": "民主和第一届奥运会", "Roads, soldiers and the Colosseum": "道路、士兵和斗兽场", "Hunters, fire and cave paintings": "猎人、火和洞穴壁画", "Sailors from the north": "来自北方的航海家", "Moats, towers and drawbridges": "护城河、塔楼和吊桥", "A road for trade and ideas": "贸易和思想交流之路", "Books for everyone": "让人人都有书读", "Machines change the world": "机器改变世界", "The Apollo 11 mission, 1969": "1969 年阿波罗 11 号任务"});
LWLang.add(SUB);
LWLang.addRe([
 [/^[›»]\s*([A-Za-z]+)$/,function(m){return SUB[m[1]]||null}],
 [/^(Biology|Chemistry|Science|Geography|History) Word Lab: (.+)$/,function(m){var t=T[m[2]];return t?SUB[m[1]]+'词汇实验室：'+t[0]:null}],
 [/^(\u2190\s*)(.+)$/,function(m){var t=T[m[2]];return t?'← '+t[0]:null}],
 [/^(.+?)(\s*\u2192)$/,function(m){var t=T[m[1]];return t?t[0]+' →':null}]
]);
window.__WLT=T;
})();
