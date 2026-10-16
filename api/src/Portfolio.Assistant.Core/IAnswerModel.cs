namespace Portfolio.Assistant.Core
{
    /// <summary>Answers a prompt; Foundry implements it in task 1.4.</summary>
    public interface IAnswerModel
    {
        /// <summary>The deployment name, for reports and logs.</summary>
        string Deployment { get; }

        /// <summary>Answers one prompt; throws when the call fails.</summary>
        Task<ModelAnswer> AnswerAsync(Prompt prompt, CancellationToken cancellationToken);
    }
}
