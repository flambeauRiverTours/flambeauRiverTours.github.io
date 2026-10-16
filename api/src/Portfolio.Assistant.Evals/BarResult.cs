namespace Portfolio.Assistant.Evals
{
    /// <summary>Whether results meet the launch bar.</summary>
    /// <param name="Overall">The share of all cases that passed.</param>
    /// <param name="Strict">The share passed in each strict category that was run.</param>
    internal sealed record BarResult(double Overall, IReadOnlyDictionary<Category, double> Strict, bool Met);
}
