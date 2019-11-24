Anonymous chat, when ran, will check for username and name of chatroom saved in the localstorage;

If previously stored username is not found, the user will be prompted for an username until the user sets an        username. No type check for username is in place. Only string length > 0 must be satisfied. App being annonymous
in nature, does not save usernames in the server or check for duplicates, hence allows for multiple users being
able to use identical usernames.

If a room name is not found, the user will be joined in to the default main room.

The user can create chat rooms. User is automatically moved to the new chat room created by him/her.

Names of chat rooms are compiled as a list and users can click to switch rooms.

Messages sent in chat rooms are time stamped and storred in the server upto a 100 msgs per room including the senders username and timestamp and are visible by anyone who enters said room. Messages are styled according to outgoing and incomming on the front end.

When a user logs in, the username is entered in to a list of online users. Clicking on the name of an user will allow another user to send a private message to the user via prompt. The recpient of the message will see an alert box appear with the sender's name and message. Privte messages are not saved anywhere and are not a two way conversation. They are of read and discard nature.

When an user disconnects, user name is removed from the list of users and a global user has disconnectd message is broadcasted to all rooms.

When users enter or leaves or joins a room, the room in question gets a user has joined and user has left message with timestamp.
