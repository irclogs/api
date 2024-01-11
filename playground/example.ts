import {CouchDB} from "@irclogs/api";

type T = "a" | "B";
let a: T = "a";

const db = new CouchDB("https://db.softver.org.mk/irclog/", "_design/log/_view/channel");
let res = await db.fetchChannelList();
console.log(res);
