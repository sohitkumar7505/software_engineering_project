export const generateSearchPlan = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query is required to create a search journey.' });
    }

    const steps = [
      {
        stepNumber: 1,
        title: 'Understand Intent',
        detail: `Break down the query: "${query}" into main user goal and constraints.`
      },
      {
        stepNumber: 2,
        title: 'Collect Sources',
        detail: 'List candidate docs/tutorials/code examples likely to solve this need.'
      },
      {
        stepNumber: 3,
        title: 'Filter and Validate',
        detail: 'Rank by relevance and remove outdated or duplicate information.'
      },
      {
        stepNumber: 4,
        title: 'Build Action Plan',
        detail: 'Convert findings into executable implementation tasks with sequence.'
      },
      {
        stepNumber: 5,
        title: 'Review Outcome',
        detail: 'Check if final solution satisfies the original query and iterate if needed.'
      }
    ];

    const summary =
      'Planning starts by understanding your query, then narrowing useful sources, and finally creating a stepwise execution path.';

    return res.status(200).json({ query, steps, summary });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while generating search journey.' });
  }
};
