/* Chemistry Word Lab sheets: headings, instructions, cool-fact passages (set per page with data-zh) and speaking questions. */
(function(){
var TT={'Why do onions make you cry?':'洋葱为什么会让你流泪？','How do chemists pull medicine from a plant?':'化学家是怎样从植物里提取药物的？','Medicine from plants':'植物里的药物','Why do fireflies glow?':'萤火虫为什么会发光？','Why does metal rust?':'金属为什么会生锈？'};
LWLang.add({
'Chemistry Word Lab':'化学词汇实验室','Chemistry Word Lab 2':'化学词汇实验室 2','Chemistry Word Lab 3':'化学词汇实验室 3','Chemistry Word Lab 4':'化学词汇实验室 4',
'1. Brain teasers':'1. 脑筋急转弯','2. Brain teasers':'2. 脑筋急转弯','3. Word hunt':'3. 找单词','3. True or false':'3. 判断对错','3. Fill in the blanks':'3. 填空','3. Put in order':'3. 排顺序','3. Match the words':'3. 词义配对','4. Speak (1 minute)':'4. 说一说（1 分钟）',
'Read each clue. Say the English word. Write it.':'读每条线索。说出英文单词，再写下来。','Find these words in the grid (across or down).':'在方格里找出这些单词（横着或竖着找）。','Read each sentence. Use the cool fact. Tick True or False.':'读每句话，根据有趣的小知识，勾选对（True）或错（False）。','Write a word from the box in each space.':'从方框里选一个词，填进每个空格。','Write 1 to 5 in the boxes to show the right order.':'在方框里写 1 到 5，表示正确的顺序。','Write the letter of the right meaning in each box.':'在每个方框里写上正确意思的字母。','In your own English, tell your teacher:':'用你自己的英语告诉老师：',
'What happens when you cut an onion?':'切洋葱的时候会发生什么？','Why do your eyes make tears?':'你的眼睛为什么会流出眼泪？','How can you cry less?':'怎样才能少流眼泪？',
'What is a solvent?':'什么是溶剂？','Why do chemists want crystals?':'化学家为什么想要晶体？','Name one disease carried by mosquitoes.':'说出一种由蚊子传播的疾病。','How does a firefly make light?':'萤火虫是怎样发光的？','Why is the light cool, not hot?':'为什么这种光是凉的，不是热的？','Why do fireflies glow at night?':'萤火虫为什么在夜里发光？',
'What three things does iron need to rust?':'铁生锈需要哪三样东西？','Why is rust a problem for bikes and bridges?':'铁锈为什么对自行车和桥是个问题？','How can people slow rust down?':'人们怎样才能让生锈变慢？',
'Related science · medicine & chemistry · not a story quiz':'相关科学 · 医药和化学 · 不是故事测验','Teasers: mosquito / solvent / crystal':'脑筋急转弯：mosquito（蚊子） / solvent（溶剂） / crystal（晶体）','Cool fact: How do chemists pull medicine from a plant?':'有趣的小知识：化学家是怎样从植物里提取药物的？','Words: malaria parasite extract solvent crystal medicine fever plant':'单词：malaria（疟疾） parasite（寄生虫） extract（提取） solvent（溶剂） crystal（晶体） medicine（药） fever（发烧） plant（植物）'
});
LWLang.addRe([
 [/^([12])\. Cool fact [—-] (.+)$/,function(m){return TT[m[2]]?m[1]+'. 有趣的小知识 — '+TT[m[2]]:null}],
 [/^English \+ science · for (.+?) · about 25 minutes(?: · (.+))?$/,function(m){var n=m[1]==='a smart teenager'?'聪明的青少年':m[1];return '英语＋科学 · 适合 '+n+' · 大约 25 分钟'+(m[2]&&TT[m[2]]?' · '+TT[m[2]]:'')}]
]);
})();
