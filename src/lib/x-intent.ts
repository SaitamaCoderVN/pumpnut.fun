interface TweetOptions {
  text?: string;
  url?: string;
  hashtags?: string[];
  via?: string;
}

interface FollowOptions {
  screenName: string;
}

interface LikeOptions {
  tweetId: string;
}

export function createXIntentLink(
  action: 'tweet' | 'follow' | 'like',
  options: TweetOptions | FollowOptions | LikeOptions
): string {
  const base = 'https://x.com/intent';
  const params = new URLSearchParams();

  switch (action) {
    case 'tweet': {
      const tweetOptions = options as TweetOptions;
      if (tweetOptions.text) params.append('text', tweetOptions.text);
      if (tweetOptions.url) params.append('url', tweetOptions.url);
      if (tweetOptions.hashtags?.length) {
        params.append('hashtags', tweetOptions.hashtags.join(','));
      }
      if (tweetOptions.via) params.append('via', tweetOptions.via);
      return `${base}/tweet?${params.toString()}`;
    }

    case 'follow': {
      const followOptions = options as FollowOptions;
      if (!followOptions.screenName) {
        throw new Error("Missing 'screenName' for follow");
      }
      return `${base}/follow?screen_name=${encodeURIComponent(followOptions.screenName)}`;
    }

    case 'like': {
      const likeOptions = options as LikeOptions;
      if (!likeOptions.tweetId) {
        throw new Error("Missing 'tweetId' for like");
      }
      return `${base}/like?tweet_id=${encodeURIComponent(likeOptions.tweetId)}`;
    }

    default:
      throw new Error("Invalid action. Use: 'tweet', 'follow', or 'like'");
  }
} 