import { config } from 'dotenv';
import { InboxStream } from 'snoostorm';
import Snoowrap from 'snoowrap';
import checkUser from './check-user';
import formatReview from './format-review';

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
const launchTimeInSeconds = Date.now() / 1000;
// const launchTimeInSeconds = 1622466592 - 1; // time of first relevant comment, for manual testing
const inbox = new InboxStream(client);
inbox.on('item', (item) => {
  // Ignore posts that were likely already replied to
  if (item.created_utc < launchTimeInSeconds) {
    return;
  }
  // if (item.subreddit_name_prefixed !== 'r/ShillSniffingBot') {
  //   return;
  // }
  if (item.parent_id) {
    client.getComment(item.parent_id).fetch()
      .then((comment) => comment.author.fetch())
      .then(checkUser)
      .then(formatReview)
      .then((reply) => {
        console.log(reply);
        item.reply(reply);
      });
  }
});

// reddit.getUser('degrees97').getComments()
//   .then((comments) => {
//     comments.forEach((comment) => {
//       console.log(comment.body);
//     });
//   });

// reddit.getSubreddit('ShillSniffingBot').getModerators().forEach((user) => {
//   console.log(user);
// });
