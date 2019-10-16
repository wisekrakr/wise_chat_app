const Mongo = require("mongodb").MongoClient;
const client = require("socket.io").listen(4000).sockets;

// Connect to Mongo
Mongo.connect("mongodb://127.0.0.1/wisechat", (err, c) => {
  if (err) {
    throw err;
  }
  console.log("MongoDB is connected...");

  //  Connect to socket.io
  client.on("connection", socket => {
    let chat = c.db("wisechat").collection("chats");

    // Get chats from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray((err, res) => {
        if (err) {
          throw err;
        }

        //   Emit the messages
        socket.emit("output", res);
      });

    //   Handle Input events
    socket.on("input", data => {
      let name = data.name;
      let message = data.message;

      //   Check for name and message
      if (name == "" || message == "") {
        // Send error status
        sendStatus(socket, "Please enter a name and message");
      } else {
        //   Insert message into database
        chat.insertMany(
          {
            name: name,
            message: message
          },
          () => {
            client.emit("output", [data]);

            // Send status object
            sendStatus(socket, {
              message: "Message sent",
              clear: true
            });
          }
        );
      }
    });

    // Handle clearing objects
    socket.on("clear", data => {
      // Remove all chats from the collection
      chat.deleteMany({}, () => {
        // Emit cleared
        socket.emit("cleared");
      });
    });
  });
});

// Send status to the server
sendStatus = (socket, s) => {
  socket.emit("status", s);
};
