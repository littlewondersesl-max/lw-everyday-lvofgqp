/* Word-by-Word Reader: interface labels. The story titles and the full Chinese translations live in games/word-reader/texts-zh.js. */
LWLang.add({
'Word-by-Word Reader':'逐词阅读器','Pick a level and a story. After the countdown, the words appear one at a time. Use the slider to go slower or faster.':'选一个级别和一个故事。倒计时结束后，单词会一个一个出现。拖动滑块可以变慢或变快。',
'Very short and simple':'非常短，也很简单','Past stories, and / because / so':'过去发生的故事，用 and / because / so','Richer words, linking words':'更丰富的词，连接词',
'← Back to list':'返回列表','Back to list':'返回列表','Full screen':'全屏','⏸ Paused':'已暂停','Get ready…':'准备好…','Well done!':'做得好！','Results':'结果',
'↻ Play again':'再玩一次','Next story →':'下一个故事','⏸ Pause':'暂停','▶ Play':'播放','↻ Restart':'重新开始','Speed':'速度','None':'无',
'Little Wonders · Word-by-Word Reader · Space = pause / play':'小小奇迹 · 逐词阅读器 · 空格键 = 暂停 / 播放','← Back to the app':'返回首页'
});
LWLang.addRe([
 [/^Starts at (\d+) words per minute$/,function(m){return '从每分钟 '+m[1]+' 个词开始'}],
 [/^(\d+) wpm$/,function(m){return '每分钟 '+m[1]+' 个词'}],
 [/^(\d+)\. (.+)$/,function(m){var z=LWLang.t(m[2]);return z?m[1]+'. '+z:null}],
 [/^Needs work \((\d+)\)$/,function(m){return '需要练习（'+m[1]+'）'}],
 [/^Not said \((\d+)\)$/,function(m){return '没读出来（'+m[1]+'）'}]
]);
