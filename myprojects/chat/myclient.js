//vars

var username = "";
var roomid = "";
var isLogKeeper = false;
var logMessages = [];
var my_id = 0;
var my_avatar = 0;

var usuarios = [];

//connection to the server:
var socket = new WebSocket("wss://ecv-etic.upf.edu/node/9042/ws/");
//var socket = new WebSocket("ws://localhost:9042");
socket.onopen = function(){  
    console.log("Socket has been opened! :)");
    //this.send('Hello server!');  //send something to the server
}

socket.addEventListener("close", function(e) {
    console.log("Socket has been closed: ", e); 
});


socket.onerror = function(err){  
    console.log("error: ", err );
}

function onMessageReceived(str_msg) {
    //console.log(str_msg.data);
    var msg = JSON.parse(str_msg.data);
    console.log(msg);
    
    if(msg.type == "newid"){ //when the server assigns me an id I receive it and store it
        my_id = msg.userid;
    }
    else if(msg.type == "message"){
        logMessages.push(msg);
        
        if(msg.username != username){
            var html = '<div class= "message_received"><p class="username_sender txtcolor">' + msg.username + ':</p><p class="content_message_rec">' + msg.content + '</p></div>';
            document.getElementById('result').innerHTML += html;
            document.getElementById('scroll').scrollTop = 100000;
        
        }
        
    }else if(msg.type == "newuser"){
        
        console.log("new user entered the room");
        
        var newuser = {
            id: msg.userid
        };
        
        usuarios.push(newuser);
        
        if(usuarios.length == 1){
            isLogKeeper = true; 
        }
        
        
        if(isLogKeeper){
            console.log("soy el guardian, aqui te mando los logs :)");
            
            //en esta parte del codigo hasta el comment "#####" enviamos a los otros usuarios quien esta en la sesion conectado
            
            for(i=0; i<usuarios.length; i++){            
                if(usuarios[i].id != msg.userid){ //no enviar log del destinatario, seria mandarle su propia informacion
                    var log = {
                        type: "log",
                        destiny_id: msg.userid,
                        userid: usuarios[i].id                    
                    };            
                    socket.send(JSON.stringify(log)); //eviamos el listado de usuarios que tiene el logkeeper al nuevo user
                }              
            }
            
            var log = {
                    type: "log",
                    destiny_id: msg.userid,
                    userid: my_id      
           };            
           socket.send(JSON.stringify(log)); //enviamos nuestro propio id al nuevo usuario para que sepa que existimos tmb
           
           //###################################### end section
           //ahora enviaremos los logs de mensajes
           
           for(i=0; i<logMessages.length; i++){
               console.log("sending message stored");
               logMessages[i].receivers = [msg.userid];
               logMessages[i].userid = my_id;
               socket.send(JSON.stringify(logMessages[i]));
           }
           
            
        }       
        
    }else if(msg.type == "log"){
        var newuser = {
            id: msg.userid
        };
        
        usuarios.push(newuser);
    
        
    }else if(msg.type == "out"){
        console.log(JSON.stringify(msg));
        
        //first we delete the user that just left
        for(i=0; i< usuarios.length; i++){
            if(msg.userid == usuarios[i].id){
                usuarios.splice(i, 1);//deleting the user that is out
            }          
        }        
        //now we will pick a new keeper (just in case the keeper was gone). To do that, assign keeper to the highest id in room
        var max = -1;
        for(i=0; i< usuarios.length; i++){
            max = Math.max(max, usuarios[i].id);
        }
        max = Math.max(max,my_id);
        console.log("the new keeper is: " + max);
        if(max == my_id){
            //i am the keeper now
            isLogKeeper = true;
        }
    }
    
    
}

socket.onmessage = onMessageReceived;

function say_hi() {
    var text = document.getElementById('messagebox').value;
    var html = '<div class= "message"><p class="content_message">' + text + '</p></div>';
    document.getElementById('result').innerHTML += html;
    document.getElementById('scroll').scrollTop = 100000;

    var destinatarios = [];
    
    for(i = 0; i<usuarios.length; i++){
        destinatarios.push(usuarios[i].id);
    }

    var msg = {
        content: "",
        username: "",
        type: "message",
        userid: my_id,
        receivers: destinatarios
    };
    
    msg.content = text;
    msg.username = username;
    
    socket.send(JSON.stringify(msg));
    logMessages.push(msg);

    document.getElementById('messagebox').value = "";

}

function onStart() {
    roomid = document.getElementById('room').value;
    username = document.getElementById('username').value;

    //send values to the server
    var msg = {
        content: roomid,
        username: username,
        type: "newconnection",
        userid: my_id
    };
    socket.send(JSON.stringify(msg));
    
    //hide login popup
    var loginbox = document.getElementById('login');
    loginbox.style.visibility = "hidden";

    //load page
    document.getElementById("wrap").setAttribute("style", " -webkit-filter: blur(0px)");
    document.getElementById('me').innerHTML += "<p class='name txtcolor'>" + username + "</p>";
    document.getElementById('chat').innerHTML += '<p class="sender txtcolor" id="sender">ROOM: ' + roomid + '</p>';
}

var input = document.getElementById('messagebox');

input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("say").click();
    }
});

document.getElementById('enter').addEventListener('click', onStart);


//theme functions

function pink(){
    document.getElementById("me").setAttribute("style", "background-color:#d62684;");
    document.getElementById("div2").setAttribute("style", "background-color:#d62684;");
    document.getElementById("div3").setAttribute("style", "background-color:#edd0df;");
    document.getElementById("scroll").setAttribute("style", "background-color:#eab9d3;");
    document.getElementById("div5").setAttribute("style", "background-color:#d62684;");
    document.getElementById("sendbox").setAttribute("style", "background-color:#d62684;");
    
    //message boxes
    var editCSS = document.createElement('style')
    editCSS.innerHTML = ".content_message {background-color: #d664d4;} .content_message_rec {background-color: #b527b2;} .txtcolor{color:black;} body{background-color:white;}";
    document.body.appendChild(editCSS);
}

function defaulttheme(){
    document.getElementById("me").setAttribute("style", "background-color:#66ff99;");
    document.getElementById("div2").setAttribute("style", "background-color:#66ff99;");
    document.getElementById("div3").setAttribute("style", "background-color:#eef9ed;");
    document.getElementById("scroll").setAttribute("style", "background-color:#e0f7de;");
    document.getElementById("div5").setAttribute("style", "background-color:#66ff99;");
    document.getElementById("sendbox").setAttribute("style", "background-color:#66ff99;");
    
    //message boxes
    var editCSS = document.createElement('style')
    editCSS.innerHTML = ".content_message {background-color: #00b38f;} .content_message_rec {background-color: #004d00;} .txtcolor{color:black;} body{background-color:white;}";
    document.body.appendChild(editCSS);
}

function dark(){
    document.getElementById("me").setAttribute("style", "background-color:#090e26;");
    document.getElementById("div2").setAttribute("style", "background-color:#090e26;");
    document.getElementById("div3").setAttribute("style", "background-color:#213d49;");
    document.getElementById("scroll").setAttribute("style", "background-color:#091d26;");
    document.getElementById("div5").setAttribute("style", "background-color:#090e26;");
    document.getElementById("sendbox").setAttribute("style", "background-color:#090e26;");
    
    //message boxes
    var editCSS = document.createElement('style')
    editCSS.innerHTML = ".content_message {background-color: #727d82;} .content_message_rec {background-color: #4f5254;} .txtcolor{color:white;} body{background-color:#a5a6aa;}";
    document.body.appendChild(editCSS);
}





