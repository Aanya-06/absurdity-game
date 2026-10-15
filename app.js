'use strict';
const QUESTIONS = [
['open',"Mum says, 'Maine tumhe nau mahine pet mein rakha!' What does she expect in return?"],
['open',"The sabziwala refuses Mum's final price. What's her next bargaining tactic?"],
['open',"Dad says the electricity bill is too high. What is his new household rule?"],
['open',"Mum finds an empty ice-cream tub. What extremely important thing will she store in it?"],
['open',"You open the butter-cookie tin at home. What's the surprise inside?"],
['open',"A relative says, 'You've grown so much!' What do they ask immediately after?"],
['open',"Mum is saving the 'good' crockery for special guests. Who finally qualifies?"],
['open',"Someone rings the doorbell while the house is messy. What's Mum's first command?"],
['open',"Dad falls asleep in front of the TV, but you change the channel. What's his defence?"],
['open',"Mum has bargained ₹100 down to ₹60. What extra favour does she ask the seller?"],
['open',"A guest says, 'Bas, pet bhar gaya.' What's Mum bringing from the kitchen next?"],
['open',"Dad insists Google Maps is wrong. What's his foolproof navigation method?"],
['open',"Mum finds a plastic bag inside the bag full of plastic bags. What's in the next one?"],
['open',"Your parents spot a tiny scratch on the new car. Who gets blamed first?"],
['open',"Mum says, 'Humare zamaane mein...' What extraordinary feat comes next?"],
['situation',"The sabziwala says, 'Final price!' Mum folds her arms. What's her opening line?"],
['situation',"You say you're full. Mum has made five more rotis. How does she persuade you?"],
['situation',"Your dad sees the AC set to 20°C. What emergency meeting does he call?"],
['situation',"Guests arrive early. Mum quietly hands you a pile of laundry. Where do you hide it?"],
['situation',"Your aunt asks, 'Beta, pehchana?' You have no idea who she is. What's your reply?"],
['situation',"Mum is on a video call with relatives and turns the camera on you. What's your escape plan?"],
['situation',"Dad finds a cheaper version of something you just bought. What's his victory speech?"],
['situation',"The pressure cooker whistles during an important phone call. How does your family react?"],
['situation',"A relative compares your marks with Sharma ji's kid. What new career are you assigned?"],
['situation',"Mum tastes food at a restaurant and says she can make it better. What's her review?"],
['situation',"The family is leaving at 7, but at 7:30 Dad can't find the car keys. Who's responsible?"],
['situation',"Your grandmother gets a smart speaker. What's the first job she gives it?"],
['situation',"Someone brings an expensive box of sweets. What does Mum do with the empty box?"],
['situation',"The Wi-Fi stops working. Every family member has a different theory. What's yours?"],
['situation',"Mum says, 'Just five minutes in this shop.' What happens two hours later?"],
['blank',"Mum's final bargaining line is: 'Bhaiya, __________.'"],
['blank',"Dad's solution to every household repair is __________."],
['blank',"Mum says, 'I'm not angry, I'm just __________.'"],
['blank',"The secret second use of every old ice-cream box is __________."],
['blank',"The real reason the family keeps every shopping bag is __________."],
['blank',"When guests refuse more food, Mum says, 'Just __________ more.'"],
['blank',"According to Dad, leaving the fan on for one minute costs __________."],
['blank',"Mum's ultimate threat when nobody helps clean is 'I'm going to __________.'"],
['blank',"The one thing no Indian family can throw away is __________."],
['blank',"Every family WhatsApp group has an unofficial expert on __________."],
['blank',"Sharma ji's son has achieved __________, according to your relatives."],
['blank',"When Dad says 'I'm not sleeping,' he's actually __________."],
['blank',"The extra item Mum demands for free at the vegetable stall is __________."],
['blank',"'We've got food at home' actually means we're eating __________."],
['blank',"When the doorbell rings unexpectedly, Mum shouts, 'Hide __________!'"],
];
const $=id=>document.getElementById(id);
const randomCode=()=>Array.from({length:6},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
const clean=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,500);
const norm=s=>clean(s).toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
let peer=null, hostConn=null, connections=new Map(), isHost=false, selfId='', hostId='', state=null, currentName='', roomCode='', submitDone=false;
function show(id){for(const key of ['landing','lobby','game','finished'])$(key).classList.toggle('hidden',key!==id)}
function notice(s){$('notice').textContent=s;$('notice').classList.remove('hidden');setTimeout(()=>$('notice').classList.add('hidden'),6500)}
function updateConnection(s){$('connection').textContent=s}
function announce(){if(!isHost)return;render();for(const conn of connections.values()){if(conn.open)conn.send({type:'state',state});}}
function participant(name,id){return {id,name,score:0,connected:true}}
function setupPeer(id){return new Promise((resolve,reject)=>{if(!window.Peer)return reject(new Error('PeerJS could not load. Please check internet access.'));let done=false;peer=new Peer(id,{debug:0});peer.on('open',id=>{if(!done){done=true;resolve(id)}});peer.on('error',e=>{if(!done){done=true;reject(e)}else notice('Connection issue: '+e.message)});peer.on('disconnected',()=>{updateConnection('Reconnecting…');try{peer.reconnect()}catch(e){}});peer.on('close',()=>{updateConnection('Disconnected');notice('Connection closed. Refresh to start again.')});});}
function createState(){return {phase:'lobby',players:[participant(currentName,selfId)],round:0,question:null,category:'mixed',deck:[],answers:{},flags:{},totalRounds:8};}
async function hostGame(){const name=clean($('hostName').value).slice(0,22);if(!name)return notice('Enter a display name.');$('hostBtn').disabled=true;try{currentName=name;roomCode=randomCode();hostId='absurdity-room-'+roomCode;selfId=hostId;await setupPeer(hostId);isHost=true;state=createState();peer.on('connection',conn=>{conn.on('data',msg=>receiveHost(msg,conn));conn.on('close',()=>{connections.delete(conn.peer);const p=state.players.find(p=>p.id===conn.peer);if(p)p.connected=false;announce()})});updateConnection('Hosting');render();}catch(e){notice('Could not create room: '+e.message);$('hostBtn').disabled=false;try{peer?.destroy()}catch(x){}}}
async function joinGame(){const name=clean($('joinName').value).slice(0,22),code=clean($('roomInput').value).toUpperCase();if(!name)return notice('Enter your display name.');if(!/^[A-Z2-9]{6}$/.test(code))return notice('Use a six-character room code.');$('joinBtn').disabled=true;try{currentName=name;roomCode=code;await setupPeer();selfId=peer.id;hostId='absurdity-room-'+code;hostConn=peer.connect(hostId,{reliable:true});const timeout=setTimeout(()=>{if(!hostConn.open)notice('Cannot reach the host. Check the room code and ask them to keep their tab open.')},10000);hostConn.on('open',()=>{clearTimeout(timeout);hostConn.send({type:'join',name});updateConnection('Connected')});hostConn.on('data',receiveClient);hostConn.on('close',()=>{updateConnection('Host disconnected');notice('The host left or lost the connection.')});hostConn.on('error',e=>notice('Join failed: '+e.message));}catch(e){notice('Could not join: '+e.message);$('joinBtn').disabled=false;}}
function receiveHost(msg,conn){if(!msg||typeof msg!=='object')return;if(msg.type==='join'){if(state.phase!=='lobby')return conn.send({type:'error',message:'Game already started; ask host to begin a new room.'});if(state.players.length>=12)return conn.send({type:'error',message:'Room is full.'});if(state.players.some(p=>p.id===conn.peer))return;const name=clean(msg.name).slice(0,22);if(!name)return;connections.set(conn.peer,conn);state.players.push(participant(name,conn.peer));announce();}else if(msg.type==='submit'){acceptAnswer(conn.peer,msg.text);}}
function receiveClient(msg){if(!msg||typeof msg!=='object')return;if(msg.type==='state'){state=msg.state;render()}else if(msg.type==='error')notice(msg.message)}
function startGame(){if(!isHost||state.phase!=='lobby')return;if(state.players.length<2)return notice('Invite at least one friend first. Three or more is ideal.');state.category=$('category').value;state.deck=shuffle(QUESTIONS.map((_,i)=>i).filter(i=>state.category==='mixed'||QUESTIONS[i][0]===state.category));state.round=0;for(const p of state.players)p.score=0;newRound();}
function newRound(){if(!isHost)return;if(state.round>=state.totalRounds){state.phase='finished';announce();return}const i=state.deck[state.round%state.deck.length];state.question={category:QUESTIONS[i][0],text:QUESTIONS[i][1]};state.round++;state.answers={};state.flags={};state.phase='writing';submitDone=false;announce()}
function acceptAnswer(id,text){if(!isHost||state.phase!=='writing'||!state.players.some(p=>p.id===id))return;if(state.answers[id])return;const val=clean(text);if(!val)return;state.answers[id]=val;if(Object.keys(state.answers).length===state.players.filter(p=>p.connected).length){state.phase='reveal';const groups={};for(const p of state.players){if(!state.answers[p.id])continue;const key=norm(state.answers[p.id]);(groups[key]??=[]).push(p.id)}for(const ids of Object.values(groups))if(ids.length>1)for(const id of ids)state.flags[id]='duplicate'}announce()}
function submitAnswer(){const v=clean($('answerInput').value);if(!v)return notice('Write an answer before submitting.');if(state.phase!=='writing')return;if(isHost)acceptAnswer(selfId,v);else hostConn.send({type:'submit',text:v});submitDone=true;$('submitBtn').disabled=true;$('answerInput').disabled=true;$('submittedNote').classList.remove('hidden');}
function setFlag(id,v){if(!isHost||state.phase!=='reveal')return;state.flags[id]=v;announce()}
function scoreRound(){if(!isHost||state.phase!=='reveal')return;let scored=[];for(const p of state.players){if(!state.answers[p.id])continue;if(!state.flags[p.id]){p.score++;scored.push(p.name)}}state.scored=scored;state.phase='results';announce()}
function render(){if(!state)return;const phase=state.phase;show(phase==='lobby'?'lobby':phase==='finished'?'finished':'game');$('roomCode').textContent=roomCode;$('players').innerHTML=state.players.map(p=>`<span class="person">${safe(p.name)} ${p.connected?'✓':'(offline)'}</span>`).join('');$('lobbyHelp').textContent=isHost?'Start when everyone has joined. You will also write answers.':'Waiting for the host to start…';$('hostSettings').classList.toggle('hidden',!isHost);if(phase==='lobby')return;if(phase==='finished'){const sorted=[...state.players].sort((a,b)=>b.score-a.score),top=sorted[0].score,winners=sorted.filter(x=>x.score===top).map(x=>x.name);$('winnerText').textContent=winners.length>1?'It’s a tie! '+winners.join(' & '):'Winner: '+winners[0]+' 🎉';$('finalScores').innerHTML=sorted.map((x,i)=>`<div class="score"><span>${i+1}. ${safe(x.name)}</span><b>${x.score}</b></div>`).join('');$('restartBtn').classList.toggle('hidden',!isHost);return;}
$('roundIndicator').textContent=`Round ${state.round} / ${state.totalRounds}`;$('stageIndicator').textContent=phase==='writing'?'✍️ Writing':phase==='reveal'?'👀 Reveal':'🏆 Scores';$('playerCount').textContent=`${state.players.filter(p=>p.connected).length} players`;$('questionCategory').textContent=({open:'OPEN-ENDED',situation:'SITUATION',blank:'FILL THE BLANK'})[state.question.category];$('questionText').textContent=state.question.text;
$('writingArea').classList.toggle('hidden',phase!=='writing');$('revealArea').classList.toggle('hidden',phase!=='reveal');$('roundResult').classList.toggle('hidden',phase!=='results');$('scoreboard').innerHTML=[...state.players].sort((a,b)=>b.score-a.score).map(p=>`<div class="score"><span>${safe(p.name)} ${p.id===selfId?'(you)':''}</span><b>${p.score}</b></div>`).join('');
if(phase==='writing'){submitDone=!!state.answers[selfId]||submitDone;$('answerInput').disabled=submitDone;$('submitBtn').disabled=submitDone;$('submittedNote').classList.toggle('hidden',!submitDone);if(!submitDone&&window.lastRenderedRound!==state.round){$('answerInput').value='';window.lastRenderedRound=state.round} $('submittedNote').textContent=`Answer locked. ${Object.keys(state.answers).length} of ${state.players.filter(p=>p.connected).length} submitted.`;}
if(phase==='reveal'){$('hostRevealControls').classList.toggle('hidden',!isHost);$('answers').innerHTML=state.players.filter(p=>state.answers[p.id]).map(p=>{const flag=state.flags[p.id]||'';return `<div class="answer ${flag?'duplicate':''}"><div class="who">${safe(p.name)} ${flag?'• '+safe(flag.toUpperCase()):'• UNIQUE (provisional)'}</div><div class="words">${safe(state.answers[p.id])}</div>${isHost?`<div class="flex" style="margin-top:10px"><button class="secondary small" data-id="${safe(p.id)}" data-flag="">✓ Valid</button><button class="danger small" data-id="${safe(p.id)}" data-flag="duplicate">↔ Duplicate</button><button class="danger small" data-id="${safe(p.id)}" data-flag="invalid">✕ Invalid</button></div>`:''}</div>`}).join('');if(isHost)$('answers').querySelectorAll('button[data-flag]').forEach(b=>b.addEventListener('click',()=>setFlag(b.dataset.id,b.dataset.flag)))}
if(phase==='results'){$('resultText').textContent=state.scored?.length?'Point awarded to: '+state.scored.join(', ')+'.':'No points this round!';$('nextBtn').textContent=state.round===state.totalRounds?'See final results →':'Next question →';$('nextBtn').classList.toggle('hidden',!isHost);$('waitingNext').classList.toggle('hidden',isHost)}}
$('hostBtn').onclick=hostGame;$('joinBtn').onclick=joinGame;$('startBtn').onclick=startGame;$('submitBtn').onclick=submitAnswer;$('scoreBtn').onclick=scoreRound;$('nextBtn').onclick=newRound;$('restartBtn').onclick=()=>{state.phase='lobby';state.round=0;state.answers={};state.flags={};announce()};
$('copyCode').onclick=()=>navigator.clipboard.writeText(roomCode).then(()=>notice('Room code copied!')).catch(()=>notice('Room code: '+roomCode));$('copyLink').onclick=()=>navigator.clipboard.writeText(location.href.split('?')[0]+'?room='+roomCode).then(()=>notice('Invite link copied!')).catch(()=>notice('Share your room code: '+roomCode));
const q=new URLSearchParams(location.search).get('room');if(q&&/^[A-Z2-9]{6}$/i.test(q))$('roomInput').value=q.toUpperCase();
