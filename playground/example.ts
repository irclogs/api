import {CouchDB} from "irclog-api";

type T = "a" | "B";
let a: T = "a";

const db = new CouchDB("https://db.softver.org.mk", "irclog");
let res = await db.fetchChannelList();
console.log(res);
