import { useState,useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 import.meta.env.VITE_SUPABASE_URL,
 import.meta.env.VITE_SUPABASE_ANON_KEY
)

function Navbar({tab,setTab}){

return(

<div className="flex gap-6 p-4 border-b border-zinc-800">

<button onClick={()=>setTab("raid")}>레이드</button>

<button onClick={()=>setTab("board")}>게시판</button>

<button onClick={()=>setTab("guild")}>길드원</button>

<button onClick={()=>setTab("rank")}>랭킹</button>

<button onClick={()=>setTab("myroom")}>마이룸</button>

</div>

)

}

function Login(){

async function login(){

await supabase.auth.signInWithOAuth({
provider:"google"
})

}

return(

<div className="flex justify-center items-center h-screen">

<button
onClick={login}
className="bg-purple-600 px-6 py-3 rounded"
>
LOGIN
</button>

</div>

)

}

function PostBoard({user}){

const [posts,setPosts]=useState([])
const [title,setTitle]=useState("")
const [content,setContent]=useState("")
const [comment,setComment]=useState("")

useEffect(()=>{
loadPosts()
},[])

async function loadPosts(){

const {data}=await supabase
.from("posts")
.select("*")
.order("created_at",{ascending:false})

setPosts(data||[])

}

async function createPost(){

await supabase
.from("posts")
.insert({
title,
content,
author:user.email
})

setTitle("")
setContent("")

loadPosts()

}

async function deletePost(id){

await supabase
.from("posts")
.delete()
.eq("id",id)

loadPosts()

}

async function addComment(postId){

await supabase
.from("comments")
.insert({
post_id:postId,
content:comment,
author:user.email
})

setComment("")
}

return(

<div className="max-w-4xl mx-auto py-10">

<input
value={title}
onChange={e=>setTitle(e.target.value)}
className="w-full p-2 bg-black border"
/>

<textarea
value={content}
onChange={e=>setContent(e.target.value)}
className="w-full p-2 bg-black border mt-2"
/>

<button
onClick={createPost}
className="bg-purple-600 px-4 py-2 mt-2"
>
작성
</button>

{posts.map(p=>(

<div key={p.id} className="border p-3 mt-4">

<h3>{p.title}</h3>

<p>{p.content}</p>

<button
onClick={()=>deletePost(p.id)}
className="text-red-400"
>
삭제
</button>

<input
value={comment}
onChange={e=>setComment(e.target.value)}
placeholder="댓글"
/>

<button
onClick={()=>addComment(p.id)}
>
댓글작성
</button>

</div>

))}

</div>

)

}


function GuildMembers(){

const [members,setMembers]=useState([])
const [name,setName]=useState("")
const [job,setJob]=useState("")
const [level,setLevel]=useState("")

useEffect(()=>{
loadMembers()
},[])

async function loadMembers(){

const {data}=await supabase
.from("guild_members")
.select("*")

setMembers(data||[])

}

async function addCharacter(){

await supabase
.from("guild_members")
.insert({
character_name:name,
class_name:job,
item_level:level
})

setName("")
setJob("")
setLevel("")

loadMembers()

}

async function deleteChar(id){

await supabase
.from("guild_members")
.delete()
.eq("id",id)

loadMembers()

}

return(

<div className="max-w-6xl mx-auto py-10">

<input
placeholder="캐릭터"
value={name}
onChange={e=>setName(e.target.value)}
/>

<input
placeholder="직업"
value={job}
onChange={e=>setJob(e.target.value)}
/>

<input
placeholder="아이템레벨"
value={level}
onChange={e=>setLevel(e.target.value)}
/>

<button onClick={addCharacter}>
등록
</button>

<div className="grid grid-cols-4 gap-4 mt-6">

{members.map(m=>(

<div key={m.id} className="bg-zinc-900 p-4">

<div>{m.character_name}</div>

<div>{m.class_name}</div>

<div>{m.item_level}</div>

<button
onClick={()=>deleteChar(m.id)}
className="text-red-400"
>
삭제
</button>

</div>

))}

</div>

</div>

)

}


function RaidCalendar(){

const [raids,setRaids]=useState([])
const [title,setTitle]=useState("")
const [date,setDate]=useState("")

useEffect(()=>{
loadRaids()
},[])

async function loadRaids(){

const {data}=await supabase
.from("raids")
.select("*")

setRaids(data||[])

}

async function createRaid(){

await supabase
.from("raids")
.insert({
title,
raid_date:date
})

setTitle("")
setDate("")

loadRaids()

}

async function joinRaid(id,user){

await supabase
.from("raid_members")
.insert({
raid_id:id,
user_id:user.id
})

}

return(

<div className="max-w-4xl mx-auto py-10">

<input
value={title}
onChange={e=>setTitle(e.target.value)}
placeholder="레이드"
/>

<input
type="date"
value={date}
onChange={e=>setDate(e.target.value)}
/>

<button onClick={createRaid}>
생성
</button>

{raids.map(r=>(

<div key={r.id} className="border p-3 mt-4">

<div>{r.title}</div>

<div>{r.raid_date}</div>

<button onClick={()=>joinRaid(r.id)}>
참가
</button>

</div>

))}

</div>

)

}


function Ranking(){

const [members,setMembers]=useState([])

useEffect(()=>{

load()

},[])

async function load(){

const {data}=await supabase
.from("profiles")
.select("*")
.order("points",{ascending:false})

setMembers(data||[])

}

return(

<div className="max-w-4xl mx-auto py-10">

<h2 className="text-2xl mb-6">
길드 랭킹
</h2>

{members.map(m=>(

<div key={m.id} className="border p-3">

{m.nickname} - {m.points}

</div>

))}

</div>

)

}

function MyRoom({profile}){

return(

<div className="max-w-4xl mx-auto py-20 text-center">

<h2 className="text-3xl">
{profile?.nickname}
</h2>

<p>
포인트 : {profile?.points}
</p>

</div>

)

}

export default function App(){

const [user,setUser]=useState(null)
const [profile,setProfile]=useState(null)
const [tab,setTab]=useState("raid")

useEffect(()=>{

init()

},[])

async function init(){

const {data:{session}}=
await supabase.auth.getSession()

if(session){

setUser(session.user)

const {data}=await supabase
.from("profiles")
.select("*")
.eq("id",session.user.id)
.single()

setProfile(data)

}

}

if(!user){

return <Login/>

}

return(

<div className="bg-black min-h-screen text-white">

<Navbar tab={tab} setTab={setTab}/>

{tab==="raid" && <RaidCalendar/>}

{tab==="board" && <PostBoard user={user}/>}

{tab==="guild" && <GuildMembers/>}

{tab==="rank" && <Ranking/>}

{tab==="myroom" && <MyRoom profile={profile}/>}

</div>

)

}


function GuildNotice({user}){

const [notices,setNotices]=useState([])
const [title,setTitle]=useState("")
const [content,setContent]=useState("")

useEffect(()=>{
loadNotices()
},[])

async function loadNotices(){

const {data}=await supabase
.from("notices")
.select("*")
.order("created_at",{ascending:false})

setNotices(data||[])

}

async function createNotice(){

await supabase
.from("notices")
.insert({
title,
content,
author:user.email
})

setTitle("")
setContent("")

loadNotices()

}

return(

<div className="max-w-4xl mx-auto py-10">

<h2 className="text-2xl mb-4">
길드 공지
</h2>

<input
value={title}
onChange={e=>setTitle(e.target.value)}
placeholder="공지 제목"
className="w-full p-2 border bg-black"
/>

<textarea
value={content}
onChange={e=>setContent(e.target.value)}
placeholder="공지 내용"
className="w-full p-2 border bg-black mt-2"
/>

<button
onClick={createNotice}
className="bg-purple-600 px-4 py-2 mt-2"
>
공지 작성
</button>

{notices.map(n=>(

<div key={n.id} className="border p-4 mt-4">

<h3 className="text-lg font-bold">
{n.title}
</h3>

<p className="mt-2">
{n.content}
</p>

<div className="text-sm text-zinc-400">
{n.author}
</div>

</div>

))}

</div>

)

}

function AdminPanel(){

const [users,setUsers]=useState([])

useEffect(()=>{
loadUsers()
},[])

async function loadUsers(){

const {data}=await supabase
.from("profiles")
.select("*")

setUsers(data||[])

}

async function givePoints(id){

await supabase
.from("profiles")
.update({
points:100
})
.eq("id",id)

loadUsers()

}

return(

<div className="max-w-5xl mx-auto py-10">

<h2 className="text-2xl mb-6">
관리자 패널
</h2>

{users.map(u=>(

<div key={u.id} className="border p-3 flex justify-between">

<div>
{u.nickname} ({u.points})
</div>

<button
onClick={()=>givePoints(u.id)}
className="bg-purple-600 px-3 py-1"
>
포인트 지급
</button>

</div>

))}

</div>

)

}

function useAdmin(profile){

if(!profile) return false

return profile.role==="admin"

}








