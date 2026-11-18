/* Alphabet Lights: interface labels and instructions. The letters, words and the word-type answers stay English-only. */
LWLang.add({
'Home':'首页','Alphabet Lights':'字母灯','Sequence':'字母顺序','Word Sequence':'单词顺序','Spelling':'拼写','Letter Table':'字母表','Play':'开始','Start':'开始','Start over':'重新开始','Next':'下一个','Results':'看结果','Next letter':'下一个字母','Next one':'下一个',
'Bonus':'加分题','Bonus: word type':'加分题：词的种类','What kind of word is it?':'这是哪一类词？','Skip':'跳过','Teacher: tap to show answer':'老师：点一下，显示答案','Teacher: tap a box when the answer is right':'老师：答案正确时，点一下方格',
'✓ Correct':'正确','✗ Replay':'再来一次','✗ Wrong / Next':'错了 / 下一个','Round complete':'这一轮完成了','Next level':'下一关','Play again':'再玩一次',
'Press Play to start':'点“开始”开始游戏','Press Start to pick a letter':'点“开始”来选一个字母','Picking a letter...':'正在选字母…','Watch again!':'再看一遍！','Say it!':'大声说出来！','Tap the letters in order!':'按顺序点一点字母！','Drag the letters across!':'把字母拖过去！',
'Bonus point!':'加一分！','Amazing work! You finished every level.':'太了不起了！你完成了每一关。','All 4 levels complete!':'4 关全部完成！','Back to Level 1':'回到第 1 关','Replay Level 4':'重玩第 4 关'
});
LWLang.addRe([
 [/^Round (\d+)\/(\d+)$/,function(m){return '第 '+m[1]+'/'+m[2]+' 轮'}],
 [/^Level (\d)$/,function(m){return '第 '+m[1]+' 关'}],
 [/^(\d) letters$/,function(m){return m[1]+' 个字母'}],
 [/^(\d) or (\d) letters$/,function(m){return m[1]+' 或 '+m[2]+' 个字母'}],
 [/^Level (\d) complete!$/,function(m){return '第 '+m[1]+' 关完成了！'}],
 [/^Go to Level (\d) now$/,function(m){return '现在去第 '+m[1]+' 关'}],
 [/^Stay and replay Level (\d)$/,function(m){return '留下来重玩第 '+m[1]+' 关'}],
 [/^Level (\d) \((.+)\) starts in (\d)\.\.\.$/,function(m){var l=LWLang.t(m[2]);return '第 '+m[1]+' 关（'+(l||m[2])+'）还有 '+m[3]+' 秒开始…'}],
 [/^(\d+) out of (\d+)$/,function(m){return m[2]+' 个里答对了 '+m[1]+' 个'}],
 [/^(\d+) answers$/,function(m){return '答了 '+m[1]+' 个'}],
 [/^(\d+) of (\d+) prompts answered across (\d+) letters$/,function(m){return m[3]+' 个字母，共 '+m[2]+' 个提示，答了 '+m[1]+' 个'}],
 [/^Bonus word types: (\d+)\s*$/,function(m){return '加分题答对：'+m[1]}]
]);
