namespace adramelech.Common;

public class Result
{
    protected Result(bool success, Exception? exception)
    {
        switch (success)
        {
            case true when exception is not null:
                throw new ArgumentException("Success and exception are mutually exclusive");
            case false when exception is null:
                throw new ArgumentException("Failure must have an exception");
            default:
                Success = success;
                Exception = exception;
                break;
        }
    }

    public bool Success { get; }
    public bool IsFailure => !Success;
    public Exception? Exception { get; private set; }

    public static implicit operator Result(bool success)
    {
        return new Result(success, null);
    }

    public static implicit operator Result(Exception exception)
    {
        return new Result(false, exception);
    }
}

public class Result<T> : Result
{
    private Result(T? value, bool success, Exception? exception) : base(success, exception)
    {
        Value = value;
    }

    public T? Value { get; private set; }

    public static implicit operator Result<T>(T? value)
    {
        return new Result<T>(value, true, null);
    }

    public static implicit operator Result<T>(Exception exception)
    {
        return new Result<T>(default, false, exception);
    }
}