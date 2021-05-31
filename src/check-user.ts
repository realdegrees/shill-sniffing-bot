import Sentiment from 'sentiment';
import {
  Comment, Listing, RedditUser, Submission, VoteableContent,
} from 'snoowrap';
import environment from './environment';
import isNotNullOrUndefined from './helpers/is-not-null-or-undefined';
import median from './helpers/median';

const sentiment = new Sentiment();
const sentimentOptions = {
  extras: {
    ape: 2,
    sell: -2,
    buy: 2,
  },
};

const fetchListing = async <T extends VoteableContent<unknown>>(
  listing: Listing<T>,
  timeFrameMs: number = environment.TIME_FRAME_MS,
): Promise<T[]> => {
  let submissions = listing;
  while (!submissions.isFinished
    && Date.now() / 1000 - (submissions[submissions.length - 1]).created_utc < timeFrameMs / 1000) {
    // eslint-disable-next-line no-await-in-loop
    submissions = await submissions.fetchMore({
      amount: 200,
      append: true,
      skipReplies: true,
    });
  }
  return submissions.filter((item) => Date.now() / 1000 - item.created_utc < timeFrameMs / 1000);
};

const getComments = async (
  user: RedditUser,
  timeFrameMs: number = environment.TIME_FRAME_MS,
): Promise<Comment[]> => user.getComments().then((posts) => fetchListing(posts, timeFrameMs));

const getSubmissions = async (
  user: RedditUser,
  timeFrameMs: number = environment.TIME_FRAME_MS,
): Promise<Submission[]> => user.getSubmissions().then((posts) => fetchListing(posts, timeFrameMs));

const filterPostsBySub = <T extends VoteableContent<unknown>>(
  posts: T[],
  subreddits: string[],
  exclude?: boolean,
): T[] => posts.filter((post) => (exclude
    ? !subreddits.includes(post.subreddit_name_prefixed)
    : subreddits.includes(post.subreddit_name_prefixed)));

const getActiveSubreddits = (
  fromPosts: (Submission | Comment)[],
): string[] => fromPosts
  .map((post) => post.subreddit_name_prefixed)
  .reduce((uniqueSubs: string[], curr: string) => {
    if (!uniqueSubs.some((sub) => sub === curr)) {
      uniqueSubs.push(curr);
    }
    return uniqueSubs;
  }, []);

const getPriceSentiment = (textPosts: string[]): string[] => {
  const pricePosts = textPosts.filter((text) => (text.match(/ceiling/i)
    || text.match(/floor/i)
    || text.match(/sell/i))
    && text.match(/[0-9.,]+\s?(k|mil|million|m|mm|thousand)\s/i));

  return pricePosts.map((text) => text
    .match(/[0-9.,]+\s?(k|mil|million|m|mm|thousand)\s/i))
    .filter(isNotNullOrUndefined)
    .map((result) => result?.[0].trim());
};

export default async (user: RedditUser): Promise<UserReview> => {
  const accountAgeInDays = ((Date.now() - user.created_utc) / 1000 / 60 / 60 / 24);
  const commentsPosted = await getComments(user);
  const submissionsPosted = await getSubmissions(user);
  const postsPosted = [...commentsPosted, ...submissionsPosted];
  const activeSubreddits = getActiveSubreddits(postsPosted);

  const [postsGenericGME, postsGenericFinance, postsMeltdown, postsOther] = await Promise.all([
    filterPostsBySub(postsPosted, environment.SUBREDDITS.GME),
    filterPostsBySub(postsPosted, environment.SUBREDDITS.FINANCE),
    filterPostsBySub(postsPosted, environment.SUBREDDITS.ANTI_GME),
    filterPostsBySub(postsPosted, [
      ...environment.SUBREDDITS.FINANCE,
      ...environment.SUBREDDITS.GME,
      ...environment.SUBREDDITS.ANTI_GME,
    ], true),
  ]);

  const postsData: Posts = {
    totalInTimeFrame: postsPosted.length,
    totalInGenericFinance: postsGenericFinance.length,
    totalInGenericGME: postsGenericGME.length,
    totalInAntiGME: postsMeltdown.length,
    totalInOther: postsOther.length,
  };
  const votingData: Voting = {
    avgUpvotesReceivedInGenericGME: postsGenericGME.map((post) => post.ups).reduce((avg, num) => avg + num, 0) / postsGenericGME.length,
    avgDownvotesReceivedInGenericGME: postsGenericGME.map((post) => post.downs).reduce((avg, num) => avg + num, 0) / postsGenericGME.length,
    medianUpvotesReceivedInGenericGME: median(postsGenericGME.map((post) => post.ups)),
    medianDownvotesReceivedInGenericGME: median(postsGenericGME.map((post) => post.downs)),
  };

  const reportsReceived = postsGenericGME.reduce((sum, post) => sum + post.num_reports, 0);

  const commentSentiment = commentsPosted.map((comment) => sentiment.analyze(comment.body, sentimentOptions));
  const submissionSentiment = submissionsPosted
    .filter((submission) => submission.selftext)
    .map((submission) => sentiment.analyze(submission.selftext, sentimentOptions));
  const commentSentimentGME = filterPostsBySub(commentsPosted, environment.SUBREDDITS.GME)
    .map((comment) => sentiment.analyze(comment.body, sentimentOptions));
  const submissionSentimentGME = filterPostsBySub(submissionsPosted, environment.SUBREDDITS.GME)
    .filter((submission) => submission.selftext)
    .map((submission) => sentiment.analyze(submission.selftext, sentimentOptions));

  const allSentiment = [...commentSentiment, ...submissionSentiment];
  const allSentimentGME = [...commentSentimentGME, ...submissionSentimentGME];

  const averageSentiment = allSentiment.reduce((avg, result) => avg + result.score, 0) / allSentiment.length;
  const averageSentimentGME = allSentimentGME.reduce((avg, result) => avg + result.score, 0) / allSentimentGME.length;

  const textPostsGME = [
    ...commentsPosted
      .filter((comment) => environment.SUBREDDITS.GME.includes(comment.subreddit_name_prefixed))
      .map((comment) => comment.body.toLowerCase()),
    ...submissionsPosted
      .filter((submission) => environment.SUBREDDITS.GME.includes(submission.subreddit_name_prefixed) && submission.selftext)
      .map((submission) => submission.selftext.toLowerCase()),
  ];
  const priceSentiment = getPriceSentiment(textPostsGME);

  // console.log(accountAgeInDays.toFixed(2));
  // console.log(activeSubreddits);
  // console.log(reportsReceived);
  // console.log(postsData);
  // console.log(votingData);
  // console.log(`Sentiment Score: ${averageSentiment}`);
  // console.log(`Sentiment Score GME Subs: ${averageSentimentGME}`);
  // console.log(priceSentiment);

  return {
    username: user.name,
    accountAge: accountAgeInDays,
    posts: postsData,
    priceSentiment,
    reportsReceivedGME: reportsReceived,
    sentimentAll: averageSentiment,
    sentimentGME: averageSentimentGME,
    uniqueSubreddits: activeSubreddits,
    voting: votingData,
  };
};
