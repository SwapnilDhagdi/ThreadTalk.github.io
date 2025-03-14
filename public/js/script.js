



const socket=io();

window.onpageshow=function(event){
   if(event.persisted)
   {
      window.location.reload();
   }
};
window.addEventListener("load",()=>
{
   document.querySelector(".overlay").style.display="flex";
   setTimeout(()=>
   {
      document.querySelector(".overlay").style.display="none";
   },2500);
});
const like=document.querySelectorAll(".upvote");
const dislike=document.querySelectorAll(".downvote");
const votes=document.querySelectorAll(".Votes");
const comment=document.querySelectorAll(".comment");
const post=document.querySelectorAll(".title");
const community=document.querySelectorAll(".communities");
console.log(like);


try{
if(document.querySelector(".log").textContent.trim()=="Sign Up"){
   console.log("true");
   dislike.forEach(element=>{
      element.disabled=true;
      element.addEventListener("click",(event)=>{
         alert("please signin first");
      });
   });
   like.forEach(element=>{
      element.disabled=true;
      element.addEventListener("click",(event)=>{
         alert("please Sign in first");
      });
   });
   comment.forEach(element=>{
      element.disabled=true;
      element.addEventListener("click",(event)=>{
         alert("please Sign in first");
      });
   });

}else{
   console.log("flase");
   comment.forEach(element=>
      {
         element.addEventListener("click",(event)=>
         {
            const id=event.target.parentElement.parentElement.id;
            window.location.href=`/load_post/${id}`;
         });
      }); 
   dislike.forEach(element=>
   {
      element.addEventListener("click",(event)=>
      {
         if(!document.getElementById(event.srcElement.parentElement.parentElement.id).querySelector(".upvote").disabled)
         {
            if(!document.getElementById(event.srcElement.parentElement.parentElement.id).querySelector(".downvote").disabled){
               socket.emit("dislikes",event.srcElement.parentElement.parentElement.id);
               element.disabled=true;
            }
         }
         else{
            if(!element.disabled)
            {
               element.disabled=true;
               socket.emit("dislike",event.srcElement.parentElement.parentElement.id);
               document.getElementById(event.srcElement.parentElement.parentElement.id).querySelector(".upvote").disabled=false;
            }
         }
     
      });
   });
   
   like.forEach(element => {
      element.disabled=false;
   
      element.addEventListener("click",(event)=>
      {
         if(!document.getElementById(event.srcElement.parentElement.parentElement.id).querySelector(".downvote").disabled)
         {
            if(!document.getElementById(event.srcElement.parentElement.parentElement.id).querySelector(".upvote").disabled){
               socket.emit("likes",event.srcElement.parentElement.parentElement.id);
               element.disabled=true;
   
            }
         }else{
     
            if(!element.disabled)
               {
                  console.log(event.srcElement.parentElement.parentElement.id);
                  element.disabled=true;
                  socket.emit("like",event.srcElement.parentElement.parentElement.id);
                  document.getElementById(event.srcElement.parentElement.parentElement.id).querySelector(".downvote").disabled=false;
               }
         }
      });
   
   });
}
}
catch{
   console.log("caught error");
}
post.forEach(element=>
{
   element.addEventListener("click",(event)=>
   {
      const id=event.srcElement.parentElement.id;
      window.location.href=`/load_post/${id}`;
   });
});


document.querySelector(".nav-logo").addEventListener("click",async (event)=>
{
   fetch("/home")
  .then(response => {
    if (response.ok) {
      window.location.href = "/";
   
    } else {
      console.error("Failed to load page");
    }
  })
  .catch(error => console.error("Error:", error));

});
function toggle() {
   const sidebar = document.querySelector(".sidebar");
   if (sidebar.classList.contains("toggle-out")) {
       sidebar.classList.add("toggle-in");
       sidebar.classList.remove("toggle-out");
   } else {
       sidebar.classList.add("toggle-out");
       sidebar.classList.remove("toggle-in");
   }
}
function notification_toggle()
{
   
   if(document.querySelector(".notification_sidebar").classList.contains("notification_toggle_out"))
   {
      document.querySelector(".notification_sidebar").classList.remove("notification_toggle_out");
      document.querySelector(".notification_sidebar").classList.add("notification_toggle_in");
     

   }
   else
   {
      document.querySelector(".notification_sidebar").classList.remove("notification_toggle_in");
      document.querySelector(".notification_sidebar").classList.add("notification_toggle_out");

     
   }
}


document.querySelector(".notification_btn").addEventListener("click",notification_toggle);
document.querySelector(".pannel-toggle").addEventListener("click", toggle);

const searchInput = document.querySelector(".Communities_search");
const suggestionList = document.querySelector(".suggestion_list");

document.querySelector(".Communities_search").addEventListener("keypress",async (event)=>{
   if(event.key=='Enter')
   {
      event.preventDefault;
      const query=document.querySelector(".Communities_search").value;
      const response=await fetch(`/search_community_name?q=${encodeURIComponent(query)}`);
      const res=await response.json();
      console.log("id got",res[0].community_id);
      window.location.href=`/community_place/c${res[0].community_id}`;
   }
});

searchInput.addEventListener("input", async (event) => {
  const input = event.target.value.trim();

  if (input.length > 0) {
    try {
      const response = await fetch(`/search_community?q=${encodeURIComponent(input)}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const suggestions = await response.json();
      console.log(suggestions);
      suggestionList.innerHTML = ""; 

      
      suggestions.forEach((title) => {
        const listItem = document.createElement("li");
        listItem.textContent = title;
        listItem.classList.add("suggestion_item");

      
        listItem.addEventListener("click", async () => {
          searchInput.value = title;
          suggestionList.innerHTML = "";
        });

        suggestionList.appendChild(listItem);
      });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  } else {
    suggestionList.innerHTML = "";
  }

});
const title_input=document.querySelector(".title_input");
const title_suggestion=document.querySelector(".title_suggestion");

title_input.addEventListener("input", async (event)=>
{
   const query=event.target.value.trim();
   if(query.length > 0)
   {   
   const response=await fetch(`/search?q=${encodeURIComponent(query)}`);
   const suggestion=await response.json();  

   title_suggestion.innerHTML="";
   suggestion.forEach((item)=>
   {;
      const li=document.createElement("li");
      li.classList.add("title_item");
      li.textContent=item;
      li.addEventListener("click",()=>
      {
         title_input.value=item;
         title_suggestion.innerHTML="";
      });
      title_suggestion.appendChild(li);
   });
   }
   else{
      title_suggestion.innerHTML="";
   }
});
community.forEach(element =>{
   console.log("event added");
   element.addEventListener("click",(event)=>{
      console.log(event.target.id);
     window.location.href=`/community_place/${event.target.id}`;
   });
});

document.querySelector(".comment_button").addEventListener("click",(event)=>
   {
      const comment=document.querySelector(".comment_input").value;
      const id=event.srcElement.parentElement.parentElement.id;
      if(comment=="")
      {
         document.querySelector(".comment_input").value="";
         document.querySelector(".comment_input").placeholder="please enter Comment";
      }
      else{
      console.log("comment_button clicked",comment,id);
      document.querySelector(".comment_input").value="";
      document.querySelector(".comment_input").placeholder="Comment added";
      socket.emit("add",comment,id);
      }
   });
 
   socket.on("change",(like,dislike,id)=>{
      console.log("changing");
      document.getElementById(id).querySelector(".upvote_count").textContent=like;
      document.getElementById(id).querySelector(".downvote_count").textContent=dislike; 
   });

 