// Static reference content — every URL points to the real, live problem page.
// This never changes per-deploy and isn't user data, so it lives in code,
// not the database.

export const sheetCatalog = [
    {
      id: "blind75",
      name: "Blind 75",
      subtitle: "Curated by Blind, 75 Q's",
      total: 75,
      tag: "Popular",
      sourceUrl: "https://www.techinterviewhandbook.org/best-practice-questions/",
      problems: [
        { id: "b1", title: "Two Sum", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/" },
        { id: "b2", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
        { id: "b3", title: "Contains Duplicate", difficulty: "Easy", url: "https://leetcode.com/problems/contains-duplicate/" },
        { id: "b4", title: "Product of Array Except Self", difficulty: "Medium", url: "https://leetcode.com/problems/product-of-array-except-self/" },
        { id: "b5", title: "Maximum Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/" },
        { id: "b6", title: "3Sum", difficulty: "Medium", url: "https://leetcode.com/problems/3sum/" },
        { id: "b7", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
        { id: "b8", title: "Longest Repeating Character Replacement", difficulty: "Medium", url: "https://leetcode.com/problems/longest-repeating-character-replacement/" },
        { id: "b9", title: "Merge Intervals", difficulty: "Medium", url: "https://leetcode.com/problems/merge-intervals/" },
        { id: "b10", title: "Number of Islands", difficulty: "Medium", url: "https://leetcode.com/problems/number-of-islands/" },
        { id: "b11", title: "Clone Graph", difficulty: "Medium", url: "https://leetcode.com/problems/clone-graph/" },
        { id: "b12", title: "Course Schedule", difficulty: "Medium", url: "https://leetcode.com/problems/course-schedule/" },
        { id: "b13", title: "Climbing Stairs", difficulty: "Easy", url: "https://leetcode.com/problems/climbing-stairs/" },
        { id: "b14", title: "Word Break", difficulty: "Medium", url: "https://leetcode.com/problems/word-break/" },
        { id: "b15", title: "Longest Increasing Subsequence", difficulty: "Medium", url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
        { id: "b16", title: "Merge Two Sorted Lists", difficulty: "Easy", url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
        { id: "b17", title: "Reverse Linked List", difficulty: "Easy", url: "https://leetcode.com/problems/reverse-linked-list/" },
        { id: "b18", title: "Trapping Rain Water", difficulty: "Hard", url: "https://leetcode.com/problems/trapping-rain-water/" },
        { id: "b19", title: "Valid Parentheses", difficulty: "Easy", url: "https://leetcode.com/problems/valid-parentheses/" },
        { id: "b20", title: "LRU Cache", difficulty: "Medium", url: "https://leetcode.com/problems/lru-cache/" }
      ]
    },
    {
      id: "neetcode150",
      name: "NeetCode 150",
      subtitle: "For interview prep",
      total: 150,
      tag: "",
      sourceUrl: "https://neetcode.io/practice",
      problems: [
        { id: "n1", title: "Valid Anagram", difficulty: "Easy", url: "https://leetcode.com/problems/valid-anagram/" },
        { id: "n2", title: "Group Anagrams", difficulty: "Medium", url: "https://leetcode.com/problems/group-anagrams/" },
        { id: "n3", title: "Top K Frequent Elements", difficulty: "Medium", url: "https://leetcode.com/problems/top-k-frequent-elements/" },
        { id: "n4", title: "Encode and Decode Strings", difficulty: "Medium", url: "https://leetcode.com/problems/encode-and-decode-strings/" },
        { id: "n5", title: "Valid Sudoku", difficulty: "Medium", url: "https://leetcode.com/problems/valid-sudoku/" },
        { id: "n6", title: "Binary Search", difficulty: "Easy", url: "https://leetcode.com/problems/binary-search/" },
        { id: "n7", title: "Search a 2D Matrix", difficulty: "Medium", url: "https://leetcode.com/problems/search-a-2d-matrix/" },
        { id: "n8", title: "Koko Eating Bananas", difficulty: "Medium", url: "https://leetcode.com/problems/koko-eating-bananas/" },
        { id: "n9", title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" },
        { id: "n10", title: "Search in Rotated Sorted Array", difficulty: "Medium", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
        { id: "n11", title: "Min Stack", difficulty: "Medium", url: "https://leetcode.com/problems/min-stack/" },
        { id: "n12", title: "Generate Parentheses", difficulty: "Medium", url: "https://leetcode.com/problems/generate-parentheses/" },
        { id: "n13", title: "Daily Temperatures", difficulty: "Medium", url: "https://leetcode.com/problems/daily-temperatures/" },
        { id: "n14", title: "Car Fleet", difficulty: "Medium", url: "https://leetcode.com/problems/car-fleet/" },
        { id: "n15", title: "Largest Rectangle in Histogram", difficulty: "Hard", url: "https://leetcode.com/problems/largest-rectangle-in-histogram/" }
      ]
    },
    {
      id: "striver-a2z",
      name: "Striver's A2Z DSA",
      subtitle: "By Raj Vikramaditya",
      total: 455,
      tag: "New",
      sourceUrl: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
      problems: [
        { id: "s1", title: "Find the Duplicate Number", difficulty: "Medium", url: "https://leetcode.com/problems/find-the-duplicate-number/" },
        { id: "s2", title: "Sort Colors", difficulty: "Medium", url: "https://leetcode.com/problems/sort-colors/" },
        { id: "s3", title: "Set Matrix Zeroes", difficulty: "Medium", url: "https://leetcode.com/problems/set-matrix-zeroes/" },
        { id: "s4", title: "Pascal's Triangle", difficulty: "Easy", url: "https://leetcode.com/problems/pascals-triangle/" },
        { id: "s5", title: "Next Permutation", difficulty: "Medium", url: "https://leetcode.com/problems/next-permutation/" },
        { id: "s6", title: "Kadane's Algorithm (Maximum Subarray)", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/" },
        { id: "s7", title: "Stock Buy And Sell", difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
        { id: "s8", title: "Rotate Matrix", difficulty: "Medium", url: "https://leetcode.com/problems/rotate-image/" },
        { id: "s9", title: "Merge Intervals", difficulty: "Medium", url: "https://leetcode.com/problems/merge-intervals/" },
        { id: "s10", title: "Merge Sorted Array", difficulty: "Easy", url: "https://leetcode.com/problems/merge-sorted-array/" },
        { id: "s11", title: "Majority Element (>n/2 times)", difficulty: "Easy", url: "https://leetcode.com/problems/majority-element/" },
        { id: "s12", title: "3Sum", difficulty: "Medium", url: "https://leetcode.com/problems/3sum/" },
        { id: "s13", title: "4Sum", difficulty: "Medium", url: "https://leetcode.com/problems/4sum/" },
        { id: "s14", title: "Reverse Pairs", difficulty: "Hard", url: "https://leetcode.com/problems/reverse-pairs/" }
      ]
    }
  ];

export const helpFaqs = [
  { q: "How is my C Score calculated?", a: "C Score blends your solved problems, contest ratings and streak consistency across all connected platforms into a single number, computed live from your synced data." },
  { q: "How do I earn XP?", a: "XP is derived directly from your real solved-problem counts and active days once you connect and sync a platform." },
  { q: "How often does data sync?", a: "Codoverse only syncs when you tap Save & Sync on the Connect page — there's no background polling of your accounts." },
  { q: "What is a streak?", a: "A streak counts consecutive days with real recorded activity on any connected platform, from your last sync." },
  { q: "Can I make my profile private?", a: "Yes — toggle Public profile off in Settings > Privacy." },
  { q: "How does the repo analyzer work?", a: "Paste a public GitHub repo URL and Codoverse fetches its real files and asks Claude to grade code quality and flag issues." }
];

// Convenience bundle for routes that import the whole catalog at once.
// Company data now lives in companyData.js (live, unlimited real dataset).
export const catalog = { sheetCatalog, helpFaqs };
