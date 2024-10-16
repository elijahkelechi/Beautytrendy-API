[
  {
    $match: {
      product: new ObjectId("66f37282c28f325a36396140"),
    },
  },
  {
    $group: {
      _id: "$rating",
      amount: {
        $sum: 1,
      },
    },
  },
];
