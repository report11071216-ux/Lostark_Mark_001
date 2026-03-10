import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

export interface Profile {
  id:string
  nickname:string
  role:string
  points:number
  guild_id?:string
}

export interface Post {
  id:number
  title:string
  content:string
  category:string
  created_at:string
  user_id:string
  author:string
}

export interface GuildMember {
  id:string
  character_name:string
  class_name:string
  item_level:number
  avatar_url:string
  user_id:string
}

export interface Raid {
  id:number
  title:string
  raid_date:string
  leader:string
}







import React,{useEffect,useState} from "react"
import {supabase} from "./lib/supabase"

import Navbar from "./components/Navbar"
import PostBoard from "./components/PostBoard"
import GuildMembers from "./components/GuildMembers"
import MyRoom from "./components/MyRoom"
import RaidCalendar from "./components/RaidCalendar"
import Login from "./components/Login"

export default function App(){

const [user,setUser]=useState(null)
const [profile,setProfile]=useState(null)
const [tab,setTab]=useState("home")

useEffect(()=>{

const init=async()=>{

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

init()

},[])

if(!user){

return <Login setUser={setUser}/>

}

return(

<div className="bg-black min-h-screen text-white">

<Navbar
tab={tab}
setTab={setTab}
logout={async()=>{
await supabase.auth.signOut()
location.reload()
}}
/>

{tab==="home" && <RaidCalendar/>}

{tab==="board" &&
<PostBoard
user={user}
profile={profile}
/>
}

{tab==="guild" &&
<GuildMembers/>
}

{tab==="myroom" &&
<MyRoom
user={user}
profile={profile}
/>
}

</div>

)

}

import {useEffect,useState} from "react"
import {supabase} from "../lib/supabase"

export default function PostBoard({user}){

const [posts,setPosts]=useState([])
const [title,setTitle]=useState("")
const [content,setContent]=useState("")

useEffect(()=>{

fetchPosts()

},[])

const fetchPosts=async()=>{

const {data}=await supabase
.from("posts")
.select("*")
.order("created_at",{ascending:false})

setPosts(data)

}

const addPost=async()=>{

await supabase
.from("posts")
.insert({
title,
content,
author:user.email
})

setTitle("")
setContent("")

fetchPosts()

}

const deletePost=async(id)=>{

await supabase
.from("posts")
.delete()
.eq("id",id)

fetchPosts()

}

return(

<div className="max-w-4xl mx-auto py-20">

<input
value={title}
onChange={e=>setTitle(e.target.value)}
className="w-full bg-black border p-3"
/>

<textarea
value={content}
onChange={e=>setContent(e.target.value)}
className="w-full bg-black border p-3 mt-2"
/>

<button
onClick={addPost}
className="bg-purple-600 px-4 py-2 mt-3"
>
POST
</button>

{posts.map(p=>(

<div key={p.id} className="border p-4 mt-4">

<h3>{p.title}</h3>

<p>{p.content}</p>

<button
onClick={()=>deletePost(p.id)}
className="text-red-400"
>
DELETE
</button>

</div>

))}

</div>

)

}

import {useEffect,useState} from "react"
import {supabase} from "../lib/supabase"

export default function GuildMembers(){

const [members,setMembers]=useState([])

useEffect(()=>{

fetchMembers()

},[])

const fetchMembers=async()=>{

const {data}=await supabase
.from("guild_members")
.select("*")

setMembers(data)

}

return(

<div className="max-w-6xl mx-auto py-20 grid grid-cols-4 gap-6">

{members.map(m=>(

<div key={m.id} className="bg-zinc-900 p-5 rounded-xl">

<img
src={m.avatar_url}
className="w-full h-40 object-cover"
/>

<div>{m.character_name}</div>

<div>{m.class_name}</div>

<div className="text-purple-400">
{m.item_level}
</div>

</div>

))}

</div>

)

}

export default function MyRoom({profile}){

return(

<div className="max-w-4xl mx-auto py-20 text-center">

<h2 className="text-3xl">
{profile.nickname}
</h2>

<p className="text-purple-400">
Points : {profile.points}
</p>

</div>

)

}

export default function RaidCalendar(){

return(

<div className="max-w-6xl mx-auto py-20">

<h1 className="text-3xl font-bold">
RAID SCHEDULE
</h1>

</div>

)

}



