import os

from flask import Flask, render_template, url_for, request, jsonify
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)


class Room(object):
    def __init__(self, name, msg):
        self.name = name
        self.msg = msg

# TIMESTAMP
def getTime():
    d = datetime.now()
    return d.strftime("%X") + " - " + d.strftime("%x") or "00:00:00 - 00/00/00"

# DICT OF USERS USERNAME : SESSIONID FOR USERS ONLINE
users = {}

# LIST OF OBJECT ROOMS, rooms = [(room1, [{user: user1, msg: msg1, time: time}, ...]), (room2, [{...},...])...]
rooms = []
rooms.append(Room("main", []))

@app.route("/")
def index():
    # List of usernames
    usersList = users.keys()
    return render_template("index.html", rooms=rooms, users=usersList)

# LOADS CHAT HISTORY FOR APPROPRIATE ROOM 
@app.route("/history", methods=["GET", "POST"])
def history():
    room = request.args.get("room", "")
    for x in rooms:
       if x.name == room:
            if x.msg == []:
                return jsonify("empty")
            else:
                history = x.msg
                return jsonify(history)
     
        
# USER DISCONNECTED, removes user from list of users
@socketio.on("disconnect")
def disconnect():
    sid = request.sid
    for user in users.copy():
        if users[user] == sid:
            personLeft = user
            emit("User Left", {"username" : personLeft}, broadcast=True)
            print(f"{personLeft} disconnected")
            users.pop(user)

# NEW USER JOINED, adds user to list of users                   
@socketio.on("Get Username")
def getUsername(data):
    username = data["username"]
    users[username] = request.sid
    emit("New User", {"username" : username}, broadcast=True)
    print(f"{username} connected")

# CREATE ROOM, creates new room    
@socketio.on("Create Room")
def createRoom(data):
    roomName = data["name"]
    rooms.append(Room(roomName, []))
    emit("Room Created", {"room" : roomName}, broadcast=True)
    
# JOIN ROOM       
@socketio.on("Join")
def join(data):
    room = data["room"]
    user = data["username"]
    time = getTime()
    join_room(room)
    send({"message" : user + " has joined the " + room + " room -- (" + time + ")"}, room=room)

# LEAVE ROOM
@socketio.on("Leave")
def leave(data):
    room = data["room"]
    user = data["username"]
    time = getTime()
    leave_room(room)
    send({"message" : user + " has left the " + room + " room -- (" + time + ")"}, room=room)

# PRIVATE MESSAGE    
@socketio.on("Private Message")
def handlePrivateMessage(data):
    sender = data["sender"]
    recepient = data["recepient"]
    message = data["message"]
    emit("New Private Message", {"sender" : sender, "message" : message}, room=users[recepient])

# NEW MESSAGE TO ROOM
@socketio.on("New Message")
def handleMessage(data):
    room = data["room"]
    user = data["user"]
    message = data["message"]
    time = getTime()
    for x in rooms:
        if x.name == room:
            if len(x.msg) > 99:
                x.msg.pop(0)
            x.msg.append({"user" : user, "msg" : message, "time" : time})
    emit("Message", {"user" : user, "message" : message, "time" : time}, room=room)

if __name__ == "__main__":
    socketio.run(app)
    