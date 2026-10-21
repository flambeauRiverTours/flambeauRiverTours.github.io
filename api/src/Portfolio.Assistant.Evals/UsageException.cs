namespace Portfolio.Assistant.Evals
{
    /// <summary>A bad command-line option; its message names the problem.</summary>
    internal sealed class UsageException(string message) : Exception(message);
}
