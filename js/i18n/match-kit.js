/* The 15 "Everyday Games" (match-kit): titles, instructions and interface labels. Picture labels, clue sentences and answer options stay English-only, so the Chinese never gives an answer away. */
LWLang.add({
'Before and After':'以前和以后','Chore Kit':'家务工具包','Family Team':'家庭小队','Feed the Pets':'喂宠物','Grow, Cook or Chill':'种、煮还是凉','Helper Pairs':'帮手配对',"Max's Kite Week":'Max 的风筝周','Mama and Baby':'妈妈和宝宝','Pack for the Mountain':'去爬山的行李','Read It, Find It':'读一读，找一找','Room Hop':'房间跳跳','Shadow Match':'影子配对','Taste Test':'味道测试','Use It!':'用起来！','Zoom and Guess':'放大猜一猜',
// instructions
'What happens next? Pick the after picture.':'接下来会发生什么？选出“之后”的图片。','Read the sentence. Pick the picture that finishes it.':'读句子，选出能把它补完整的图片。',
'Which tools help with each chore?':'每件家务需要哪些工具？','Read the words. Which chore needs them?':'读一读这些词，它们是哪件家务要用的？',"Put the day's chores in order.":'把一天的家务按顺序排好。',
'Who does the chore? Drag it to Mom or Dad.':'这件家务是谁做的？把它拖给妈妈或爸爸。','Who did the chore? Then choose the right word.':'这件家务是谁做的？然后选出正确的词。',
'Who eats this?':'谁吃这个？','Read the clue. Which pet is it?':'读线索，它是哪只宠物？','Where does each food go?':'每种食物该放在哪里？','Where does it go? Then pick the verb.':'它该放在哪里？然后选出动词。',
'Find the helper pairs. They work together!':'找出帮手配对。它们是一起工作的！','Match each picture with the sentence about its helper.':'把每张图片和说它帮手的句子配成一对。',
'Max wants to fly his kite. Drag the weather to the day.':'Max 想放风筝。把天气拖到对应的日子上。',"Read about Max's day. What was the weather?":'读一读 Max 的一天。那天天气怎么样？',
'Who is the baby?':'谁是宝宝？','Read and find the baby.':'读一读，找出宝宝。','Life cycle: put the pictures in order.':'生命周期：把图片按顺序排好。',
'What do you pack? Pick the right thing.':'你要带什么？选出合适的东西。','Read the sentence and fill the gap.':'读句子，把空格填好。','Read the sentence. Which object is it?':'读句子，它说的是哪个物品？','Which word fits the gap?':'哪个词适合填进空格？',
'Where does it go? Drag each thing to its room.':'它该放在哪里？把每样东西拖到它的房间。','Read the word. Which room is it in? Some things can go in two rooms.':'读一读这个词，它在哪个房间？有些东西可以放在两个房间。',
'Whose shadow is it?':'这是谁的影子？','Some shadows are turned or hidden. Whose shadow is it?':'有些影子转了方向，或者被遮住了。这是谁的影子？',
'Which food is it?':'这是哪种食物？','Compare the foods. Which one is it?':'比一比这些食物，是哪一种？','What do you do with it?':'你用它来做什么？','What did you do with it? Think about yesterday.':'你用它做了什么？想一想昨天。',
'A close-up! What is the whole food?':'这是特写！完整的食物是什么？','A big close-up and a clue. What is the food?':'一张大特写和一条线索。这是什么食物？',
// interface
'Listen':'听一听','Well done!':'做得好！','Play again':'再玩一次','First':'首先','Next':'接着','Then':'然后','Last':'最后','Finally':'终于'
});
LWLang.addRe([
 [/^(\d+) of (\d+) right the first time$/,function(m){return '第一次就答对了 '+m[1]+' / '+m[2]}],
 [/^Try (A1|A2|12\+)$/,function(m){return '试试 '+m[1]+' 级'}],
 [/^Pip's Little Wonders · (Everyday Objects|Everyday Animals|Everyday Weather|Chores|Animals|Weather|A to Z Foods) (\d)$/,function(m){var n={'Everyday Objects':'日常物品','Everyday Animals':'日常动物','Everyday Weather':'日常天气','Chores':'家务','Animals':'动物','Weather':'天气','A to Z Foods':'A 到 Z 食物'}[m[1]];return 'Pip 的小小奇迹 · '+n+' '+m[2]}]
]);
