import { config } from 'dotenv';
import { InboxStream } from 'snoostorm';
import Snoowrap from 'snoowrap';
import checkUser from './check-user';

const env = config();

if (env.error) {
  throw env.error;
}

const client = new Snoowrap({
  userAgent: 'shill-sniffing-bot',
  clientId: env.parsed?.CLIENT_ID,
  clientSecret: env.parsed?.CLIENT_SECRET,
  refreshToken: env.parsed?.REFRESH_TOKEN,
});

// const inbox = new InboxStream(client);
// inbox.on('item', (item) => {
//   console.log(`Author: ${item.author.name}`);
//   console.log(`Sub: ${item.subreddit}`);
//   console.log(item.body);
// });

client.getUser('spez').fetch().then(checkUser);

// reddit.getUser('degrees97').getComments()
//   .then((comments) => {
//     comments.forEach((comment) => {
//       console.log(comment.body);
//     });
//   });

// reddit.getSubreddit('ShillSniffingBot').getModerators().forEach((user) => {
//   console.log(user);
// });
