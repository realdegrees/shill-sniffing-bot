import {
  Comment, RedditUser, Submission, Subreddit,
} from 'snoowrap';
import environment from './environment';
import asyncFilter from './helpers/async-filter';

export default async (user: RedditUser): Promise<any> => {
  const accountAgeInDays = ((Date.now() - user.created_utc) / 1000 / 60 / 60 / 24);
  const submissionsInTimeFrame = await user.getOverview().then(async (listing) => {
    let submissions = listing;
    while (!submissions.isFinished
      && Date.now() / 1000 - (submissions[submissions.length - 1]).created_utc < environment.TIME_FRAME_MS / 1000) {
      // eslint-disable-next-line no-await-in-loop
      submissions = await submissions.fetchMore({
        amount: 50,
        append: true,
      });
    }
    return listing.filter((item) => Date.now() / 1000 - item.created_utc < environment.TIME_FRAME_MS / 1000);
  });
  const activeSubreddits = (await Promise.all(submissionsInTimeFrame.map((item) => item.subreddit.fetch())))
    .reduce((uniqueSubs: Subreddit[], curr: Subreddit) => {
      if (!uniqueSubs.some((sub) => sub.name === curr.name)) {
        uniqueSubs.push(curr);
      }
      return uniqueSubs;
    }, []);
  const subMissionsInGenericGME = asyncFilter(submissionsInTimeFrame,
    (submission) => submission.subreddit.fetch().then((subreddit) => environment.GME_SUBREDDITS.includes(subreddit.display_name)));
  const subMissionsInGenericFinance = asyncFilter(submissionsInTimeFrame,
    (submission) => submission.subreddit.fetch().then((subreddit) => environment.FINANCE_SUBREDDITS.includes(subreddit.display_name)));
  const subMissionsInOther = asyncFilter(submissionsInTimeFrame,
    (submission) => submission.subreddit.fetch().then((subreddit) => !environment.FINANCE_SUBREDDITS.includes(subreddit.display_name)));
  console.log(accountAgeInDays.toFixed(2));
  console.log(activeSubreddits.map((sub) => sub.display_name));
};

// const getFloor = (submissions: (Comment | Submission)[]): Promise<Floor> => {
//   return submissions.map((submission) => submission.)
// };
