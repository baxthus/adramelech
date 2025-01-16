namespace adramelech.Common;

public class Result
{
    protected Result(bool isSuccess, Exception? exception)
    {
        switch (isSuccess)
        {
            case true when exception is not null:
                throw new ArgumentException("Cannot be successful and have an exception", nameof(isSuccess));
            case false when exception is null:
                throw new ArgumentException("Cannot be unsuccessful and not have an exception", nameof(isSuccess));
            default:
                IsSuccess = isSuccess;
                Exception = exception;
                break;
        }
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Exception? Exception { get; private set; }

    public static implicit operator Result(bool isSuccess) => new(isSuccess, null);
    public static implicit operator Result(Exception exception) => new(false, exception);
}

public class Result<T> : Result
{
    private Result(T? value, bool isSuccess, Exception? exception) : base(isSuccess, exception)
    {
        Value = value;
    }

    public T? Value { get; private set; }

    public static implicit operator Result<T>(T value) => new(value, true, null);
    public static implicit operator Result<T>(Exception exception) => new(default, false, exception);
}