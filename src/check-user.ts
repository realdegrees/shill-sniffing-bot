import {
  Comment, Listing, RedditUser, Submission, Subreddit,
} from 'snoowrap';
import environment from './environment';
import asyncFilter from './helpers/async-filter';

const fetchListing = async (
  listing: Listing<Submission | Comment>,
  timeFrameMs: number = environment.TIME_FRAME_MS,
): Promise<(Submission | Comment
  )[]> => {
  let submissions = listing;
  while (!submissions.isFinished
    && Date.now() / 1000 - (submissions[submissions.length - 1]).created_utc < timeFrameMs / 1000) {
    // eslint-disable-next-line no-await-in-loop
    submissions = await submissions.fetchMore({
      amount: 25,
      append: true,
    });
  }
  return submissions.filter((item) => Date.now() / 1000 - item.created_utc < timeFrameMs / 1000);
};

const getPosts = async (
  user: RedditUser,
  timeFrameMs: number = environment.TIME_FRAME_MS,
): Promise<(Submission | Comment
  )[]> => user.getOverview().then((posts) => fetchListing(posts, timeFrameMs));

const filterPostsBySub = async (
  posts: (Submission | Comment)[],
  subreddits: string[],
  exclude?: boolean,
): Promise<(Submission | Comment
  )[]> => asyncFilter(
  posts,
  (post) => post.subreddit.fetch().then((subreddit) => (
    exclude
      ? !subreddits.includes(subreddit.display_name)
      : subreddits.includes(subreddit.display_name)
  )),
);

const getActiveSubreddits = async (
  fromPosts: (Submission | Comment)[],
): Promise<Subreddit[]> => Promise.all(
  fromPosts.map((post) => post.subreddit.fetch()),
).then((subreddits) => subreddits.reduce((uniqueSubs: Subreddit[], curr: Subreddit) => {
  if (!uniqueSubs.some((sub) => sub.name === curr.name)) {
    uniqueSubs.push(curr);
  }
  return uniqueSubs;
}, []));

export default async (user: RedditUser): Promise<any> => {
  const accountAgeInDays = ((Date.now() - user.created_utc) / 1000 / 60 / 60 / 24);
  const postsPosted = await getPosts(user);
  const activeSubreddits = await getActiveSubreddits(postsPosted);

  const [postsGenericGME, postsGenericFinance, postsMeltdown, postsOther] = await Promise.all([
    filterPostsBySub(postsPosted, environment.GME_SUBREDDITS),
    filterPostsBySub(postsPosted, environment.FINANCE_SUBREDDITS),
    filterPostsBySub(postsPosted, ['GME_Meltdown']),
    filterPostsBySub(postsPosted, [...environment.FINANCE_SUBREDDITS, ...environment.GME_SUBREDDITS, 'GME_Meltdown'], true),
  ]);

  const postsData: Posts = {
    totalInTimeFrame: postsPosted.length,
    totalInGenericFinance: postsGenericFinance.length,
    totalInGenericGME: postsGenericGME.length,
    totalInMeltdown: postsMeltdown.length,
    totalInOther: postsOther.length,
  };
  const votingData: Voting = {
    upvotesReceivedInGenericGME: postsGenericGME.map((post) => post.ups),
    downvotesReceivedInGenericGME: postsGenericGME.map((post) => post.downs),
  };

  const reportsReceived = postsGenericGME.reduce((sum, post) => sum + post.num_reports, 0);

  console.log(accountAgeInDays.toFixed(2));
  console.log(activeSubreddits.map((sub) => sub.display_name));
  console.log(reportsReceived);
  console.log(postsData);
  console.log(votingData);
};

// const getFloor = (submissions: (Comment | Submission)[]): Promise<Floor> => {
//   return submissions.map((submission) => submission.)
// };
