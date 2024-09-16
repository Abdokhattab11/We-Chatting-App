exports.getOnlyOneUserFromChat = (mongoDoc, userId) => {
    const chat = mongoDoc.toObject();
    if (chat.user1._id.toString() === userId) {
        chat.user = chat.user1;
    } else {
        chat.user = chat.user2;
    }
    delete chat.user1;
    delete chat.user2;
    return chat;
}
