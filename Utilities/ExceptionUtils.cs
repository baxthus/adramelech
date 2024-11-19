using adramelech.Common;

namespace adramelech.Utilities;

/// <summary>
///     Utilities for handling exceptions
/// </summary>
public static class ExceptionUtils
{
    /// <summary>
    ///     Invoke a function and return a Result
    /// </summary>
    /// <param name="func">The function to invoke</param>
    /// <typeparam name="T">The type of the result (can be inferred)</typeparam>
    /// <returns>A Result containing the result of the function or an exception</returns>
    public static Result<T> Try<T>(this Func<T> func)
    {
        try
        {
            return func();
        }
        catch (Exception e)
        {
            return e;
        }
    }

    /// <summary>
    ///     Invoke a function and return a Result
    /// </summary>
    /// <param name="func">The function to invoke</param>
    /// <returns>A Result containing the result of the function or an exception</returns>
    public static Result Try(this Action func)
    {
        try
        {
            func();
            return true;
        }
        catch (Exception e)
        {
            return e;
        }
    }

    /// <summary>
    ///     Invoke a function and return a Result
    /// </summary>
    /// <param name="func">The function to invoke</param>
    /// <typeparam name="T">The type of the result (can be inferred)</typeparam>
    /// <returns>A Result containing the result of the function or an exception</returns>
    public static async Task<Result<T>> TryAsyncM<T>(this Func<Task<T>> func)
    {
        try
        {
            return await func();
        }
        catch (Exception e)
        {
            return e;
        }
    }

    private static async Task<Result> InternalTryAsync(this Func<Task> func, Func<Task>? callback = null)
    {
        try
        {
            await func();
            return true;
        }
        catch (Exception e)
        {
            return e;
        }
        finally
        {
            if (callback is not null) await callback();
        }
    }

    /// <summary>
    ///     Invoke a function and return a Result
    /// </summary>
    /// <param name="func">The function to invoke</param>
    /// <returns>A Result containing the result of the function or an exception</returns>
    public static async Task<Result> TryAsync(this Func<Task> func)
    {
        return await InternalTryAsync(func);
    }

    /// <summary>
    ///     Invoke a function and return a Result
    /// </summary>
    /// <param name="func">The function to invoke</param>
    /// <param name="callback">The callback to invoke after the function</param>
    /// <returns>A Result containing the result of the function or an exception</returns>
    public static async Task<Result> TryAsync(this Func<Task> func, Action callback)
    {
        return await InternalTryAsync(func, () =>
        {
            callback();
            return Task.CompletedTask;
        });
    }
}