namespace Adramelech.Common;

public class Result
{
    protected Result(bool isSuccess, Exception? exception)
    {
        switch (isSuccess)
        {
            case true when exception is not null:
                throw new ArgumentException("Success and exception are mutually exclusive");
            case false when exception is null:
                throw new ArgumentException("Failure must have an exception");
            default:
                IsSuccess = isSuccess;
                Exception = exception;
                break;
        }
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Exception? Exception { get; private set; }

    public static implicit operator Result(bool isSuccess)
    {
        return new Result(isSuccess, null);
    }

    public static implicit operator Result(Exception exception)
    {
        return new Result(false, exception);
    }
}

public class Result<T> : Result
{
    private Result(T? value, bool isSuccess, Exception? exception) : base(isSuccess, exception)
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