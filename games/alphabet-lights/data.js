// Alphabet Lights data. n=noun v=verb adj=adjective adv=adverb pron=pronoun prep=preposition conj=conjunction interj=interjection art=article
window.AL={
words:{
A1:{3:"cat n,dog n,sun n,red adj,big adj,run v,hat n,cup n,bus n,pen n,box n,egg n,sit v,hot adj,bed n",
4:"fish n,book n,ball n,cake n,milk n,frog n,jump v,swim v,blue adj,tall adj,duck n,tree n,rain n,shoe n,door n",
5:"apple n,horse n,green adj,happy adj,water n,bread n,chair n,sleep v,dance v,mouse n,house n,tiger n,small adj,juice n,pizza n",
6:"banana n,orange n,yellow adj,school n,flower n,rabbit n,monkey n,purple adj,mother n,father n,garden n,window n,cookie n,little adj,turtle n",
7:"chicken n,giraffe n,kitchen n,brother n,teacher n,rainbow n,dolphin n,penguin n,monster n,picture n,morning n,sweater n,popcorn n,library n,balloon n"},
A2:{3:"fly v,ask v,old adj,new adj,map n,key n,wet adj,dry adj,eat v,cry v,arm n,leg n,toy n,sad adj,ant n",
4:"walk v,read v,cold adj,soft adj,rice n,lamp n,kite n,sing v,cook v,wild adj,moon n,star n,city n,farm n,draw v",
5:"climb v,write v,dirty adj,quiet adj,river n,beach n,cloud n,lemon n,carry v,funny adj,heavy adj,train n,snake n,throw v,sweet adj",
6:"listen v,travel v,bright adj,hungry adj,pencil n,planet n,castle n,forest n,winter n,friend n,clever adj,choose v,scared adj,bottle n,spider n",
7:"explain v,imagine v,cartoon n,blanket n,holiday n,dessert n,airport n,thunder n,careful adj,amazing adj,healthy adj,curious adj,collect v,pumpkin n,station n"},
B1:{3:"the art,and conj,but conj,she pron,him pron,wow interj,hey interj,for prep,shy adj,try v,dig v,joy n,owl n,now adv,too adv",
4:"they pron,them pron,from prep,into prep,with prep,ouch interj,oops interj,soon adv,very adv,also adv,lazy adj,busy adj,grow v,nest n,melt v",
5:"under prep,among prep,while conj,hello interj,bravo interj,often adv,never adv,quite adv,proud adj,brave adj,yours pron,build v,learn v,ocean n,honey n",
6:"behind prep,across prep,unless conj,myself pron,hooray interj,always adv,slowly adv,gentle adj,famous adj,borrow v,forget v,invent v,museum n,island n,strong adj",
7:"between prep,through prep,because conj,herself pron,himself pron,quickly adv,quietly adv,finally adv,goodbye interj,excited adj,nervous adj,explore v,believe v,history n,journey n"}},
pos:{n:"noun",v:"verb",adj:"adjective",adv:"adverb",pron:"pronoun",prep:"preposition",conj:"conjunction",interj:"interjection",art:"article"},
// prompt: [label, letters that have an easy answer]
P:{color:["a color","BGPRWYOS"],food:["a food","ABCDEFGHIJKLMNOPRSTWY"],animal:["an animal","ABCDEFGHIJKLMNOPRSTWYZ"],
 fruit:["a fruit","ABCGKLMOPSW"],toy:["a toy","BCDKPRTY"],clothes:["something you wear","BCDGHJPST"],
 doing:["something you do","BCDEFGHJKLMPRSTW"],vehicle:["a vehicle","ABCFHJKLMPRSTVY"],body:["a body part","ABCEFHKLMNST"],
 verb:["a verb","ABCDEFGHIJKLMNOPRSTUVWY"],adj:["an adjective","ABCDEFGHIKLMNOPQRSTUWY"],
 animal2:["two animals","BCDFGHLMPRST"],food2:["two foods","BCMPST"],animal3:["three animals","BCDGHLMPS"],
 place:["a place","BCFHLMPSTZ"],job:["a job","ABCDFNPSTV"]},
// A1 = 3 boxes, concrete nouns only (no verbs). A2/B1 = 4 boxes; difficulty comes from the prompts.
levels:{A1:{base:["animal","food"],extra:["color","fruit","toy","body","clothes"],cells:3,min:3},
 A2:{base:["animal","doing"],extra:["food","fruit","vehicle","body","clothes","color","adj","animal2"],cells:4,min:4},
 B1:{base:["verb","adj"],extra:["animal2","food2","animal3","place","job","vehicle","body"],cells:4,min:4}}
};
