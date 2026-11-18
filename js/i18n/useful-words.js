/* Useful Words: interface labels (the word cards, tests and worksheets already carry their own Chinese lines). */
LWLang.add({
'Useful Words':'常用词','200 very useful English words: 50 for each level. Learn ten at a time, then take the test.':'200 个非常有用的英语单词：每个级别 50 个。每次学十个，然后做小测验。',
'First words for everyday life':'日常生活的第一批词','Words for stories, plans and feelings':'讲故事、做计划、说感受的词','Linking words and ideas for longer talk':'让长一点的对话连起来的词和想法','Sharper words for essays and discussion':'写作文、做讨论时更精准的词',
'Test not taken yet':'还没有做测验','Learn':'学习','Test':'测验','All 50 words':'全部 50 个词','← All levels':'所有级别','☰ Word list':'单词列表','🖨 Print test':'打印测验',
'Meaning':'意思','Example':'例句','Why it is a good word to know':'为什么这个词值得学','← Previous':'上一个','Next →':'下一个','Take the test →':'去做测验',
'← Quit test':'退出测验','Next question →':'下一题','See my score':'看我的成绩','↻ Retry':'再做一次','Back to the list':'回到列表','🖨 Print worksheet':'打印练习单',
'Tap the speaker to hear the word':'点一下喇叭，听这个词','Perfect! 🌟':'太棒了！全对！','Great job! 👏':'做得真好！','Good work! Keep practising.':'做得不错！继续练习。','Keep going. Read the words again and retry.':'加油！再读一读这些词，然后重做一次。',
'Little Wonders · Useful Words · ← → keys = previous / next word':'小小奇迹 · 常用词 · ← → 键 = 上一个 / 下一个词'
});
LWLang.addRe([
 [/^Best test: (\d+) \/ 10$/,function(m){return '最好成绩：'+m[1]+' / 10'}],
 [/^Words (\d+)[–-](\d+)$/,function(m){return '第 '+m[1]+'–'+m[2]+' 个词'}],
 [/^Word (\d+) of 50 · Words (\d+)[–-](\d+)$/,function(m){return '第 '+m[1]+' 个词（共 50 个）· 第 '+m[2]+'–'+m[3]+' 个词'}],
 [/^Test (\d+)[–-](\d+)$/,function(m){return '测验 '+m[1]+'–'+m[2]}],
 [/^Test · Words (\d+)[–-](\d+)$/,function(m){return '测验 · 第 '+m[1]+'–'+m[2]+' 个词'}],
 [/^Test results · Words (\d+)[–-](\d+)$/,function(m){return '测验结果 · 第 '+m[1]+'–'+m[2]+' 个词'}],
 [/^Question (\d+) of 10$/,function(m){return '第 '+m[1]+' 题（共 10 题）'}],
 [/^Words to practise \((\d+)\)$/,function(m){return '需要练习的词（'+m[1]+' 个）'}],
 [/^Next batch \(words (\d+)[–-](\d+)\) →$/,function(m){return '下一组（第 '+m[1]+'–'+m[2]+' 个词）'}],
 [/^Level (A1|A2|B1|B2)$/,function(m){return m[1]+' 级'}]
]);
