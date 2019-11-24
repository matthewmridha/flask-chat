    // USERNAME
    let username;

    //ROOM
    let room;

    // DOM loaded,
    document.addEventListener('DOMContentLoaded', () => {
        // ask for usename if none exist in localStorage
        if (!localStorage.getItem("username")) {
            do {
                username = prompt("Username: ")
            }
            while (username.length < 1)
            localStorage.setItem("username", username)
        } else {
            username = localStorage.getItem("username");
        };

        if (!localStorage.getItem("room")) {
            localStorage.setItem("room", "main")
        };

        // display username
        document.querySelector("#name").innerHTML = `<h2>${username}</h2>`;

        //SOCKET
        let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

        //CONNECTED
        socket.on('connect', () => {
            if (!localStorage.getItem("room")) {
                room = "main"
            } else {
                room = localStorage.getItem("room");
            }
            joinRoom(room);
            socket.emit("Get Username", {
                "username": username
            });

            // USER CONNECTED
            socket.on("New User", data => {
                let newUser = data.username;
                const li = document.createElement('li');
                li.innerHTML = newUser;
                li.classList.add("user_list_item");
                document.getElementById("users").append(li);
            });

            // USER DISCONNECTED
            socket.on("User Left", data => {
                let personLeft = data.username;
                let list = document.getElementsByClassName("user_list_item");
                for (let i = 0; i < list.length; i++) {
                    if (list[i].innerHTML == personLeft) {
                        list[i].parentNode.removeChild(list[i]);
                    }
                };
                let li = document.createElement('li');
                li.innerHTML = `${personLeft} has disconnected`;
                li.classList.add('info');
                document.getElementById('text').append(li);
            });

            // CREATE NEW ROOM
            let form_room = document.getElementById("create_channel");
            form_room.addEventListener("submit", function(event) {
                event.preventDefault();
                name = document.getElementById("channel_name").value;
                if (name.length > 0) {
                    socket.emit("Create Room", {
                        'name': name
                    });
                    document.getElementById("channel_name").value = "";

                } else {
                    alert("Name cannot be empty");
                };
                // USER WHO CREATES ROOM GET SWITCHED TO NEW ROOM
                socket.on('Room Created', function() {
                    leaveRoom(room);
                    joinRoom(name);
                    room = name;
                    localStorage.setItem("room", room)
                    return;
                });
            });

            // NEW ROOM CREATED
            socket.on('Room Created', data => {
                addRoom = data.room;
                const li = document.createElement('li');
                li.innerHTML = addRoom;
                li.classList.add("room_list_item");
                document.getElementById("rooms").append(li);
            });

            // HANDLE ROOM CHANGE
            document.getElementById("rooms").addEventListener("click", function(e) {
                if (e.target && e.target.nodeName == "LI") {
                    let newRoom = e.target.innerHTML;
                    if (newRoom == room) {
                        alert(`already in room ${newRoom}`);
                        return;
                    } else {
                        leaveRoom(room);
                        joinRoom(newRoom);
                        room = newRoom;
                        localStorage.setItem("room", room);
                        return;
                    }
                }
            });

            // SEND MESSAGES
            let form_msg = document.getElementById("msg");
            form_msg.addEventListener("submit", function(event) {
                event.preventDefault();
                let message = document.getElementById("msg_input").value;
                if (message.length > 0) {
                    socket.emit("New Message", {
                        "message": message,
                        "room": room,
                        "user": username,
                    })
                } else {
                    return false;
                }
                document.getElementById("msg_input").value = "";
            });

            // RECIEVE NOTIFICATIONS
            socket.on('message', function(message) {
                let msg = document.createElement('li');
                msg.classList.add('info')
                msg.innerHTML = message.message;
                document.getElementById('text').append(msg);
            });

            // RECIEVE MESSAGES
            socket.on('Message', data => {
                let message = data.message;
                let sender = data.user;
                let time = data.time;
                insert_messages(message, sender, time);
            });

            // SEND PRIVATE MESSAGE
            document.getElementById("users").addEventListener("click", function(e) {
                if (e.target && e.target.nodeName == "LI" && e.target.innerHTML != username) {
                    let sender = username;
                    let recepient = e.target.innerHTML;
                    let message = prompt(`Send Private Message to ${recepient}:`);
                    socket.emit("Private Message", {
                        "recepient": recepient,
                        "message": message,
                        "sender": sender
                    })
                }
            });

            // RECEIVE PRIVATE MESSAGE
            socket.on("New Private Message", data => {
                let message = data.message;
                let sender = data.sender;
                alert(`${sender} says ${message}`)
            });

            // LEAVE ROOM
            function leaveRoom(room) {
                document.getElementById('text').innerHTML = "";
                socket.emit("Leave", {
                    "room": room,
                    "username": username,
                });
            };

            // JOIN ROOM
            function joinRoom(room) {
                let links = document.querySelectorAll(".room_list_item");
                for (let i = 0; i < links.length; i++) {
                    if (links[i].classList.contains("room_list_item_current") && links[i].classList.contains("room_list_item")) {
                        links[i].classList.remove("room_list_item_current");
                    }
                    if (links[i].innerHTML == room && links[i].classList.contains("room_list_item")) {
                        links[i].classList.add("room_list_item_current");
                    }
                };
                socket.emit("Join", {
                    "room": room,
                    "username": username,
                });
                loadHistory(room);
            };
        });

        function loadHistory(room) {
            let req = new XMLHttpRequest();
            req.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    let messages = JSON.parse(this.responseText);
                    if (messages != "empty") {
                        for (let i = 0; i < messages.length; i++) {
                            let message = messages[i].msg;
                            let sender = messages[i].user;
                            let time = messages[i].time;
                            insert_messages(message, sender, time);
                        };
                    }
                }
            };
            req.open("GET", "/history?room=" + room, true);
            req.send();
        };

        // INSERT MESSAGES
        function insert_messages(message, sender, time) {
            let msg = document.createElement('li');
            if (sender == username) {
                msg.innerHTML = message + " <br><span class='time'>--(" + time + ")</span>";
                msg.classList.add('outgoing');
            } else {
                msg.innerHTML = message + " <span class='sender'>-" + sender + " <span class='time'>--(" + time + ")</span></span>";
                msg.classList.add('incoming');
            }
            document.getElementById('text').append(msg);

        };
    });