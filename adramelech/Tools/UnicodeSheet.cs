using System.Text;

namespace adramelech.Tools;

public class UnicodeSheet(bool separateRows = false)
{
    private readonly List<Column> _columns = [];

    public UnicodeSheet AddColumn(string title, IEnumerable<string> values)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("The title cannot be null or whitespace.", nameof(title));
        if (values == null)
            throw new ArgumentNullException(nameof(values), "The values cannot be null.");

        var valuesArray = values.ToArray();
        if (valuesArray.Length == 0)
            throw new ArgumentException("The values cannot be empty.", nameof(values));
        if (_columns.Count > 0 && valuesArray.Length != _columns[0].Values.Length)
            throw new ArgumentException("The number of values must match the number of values in the first column.",
                nameof(values));

        _columns.Add(new Column { Title = title, Values = valuesArray });
        return this;
    }

    public string Build() => string.Join('\n', BuildRows());

    private IEnumerable<string> BuildRows()
    {
        if (_columns.Count == 0)
            throw new InvalidOperationException("There are no columns to build the rows.");

        var columnsLength = GetMaxColumnsLength();

        foreach (var headerRow in BuildHeaderRows(columnsLength))
            yield return headerRow;

        for (var i = 0; i < _columns[0].Values.Length; i++)
        {
            var values = _columns.Select(c => c.Values[i]).ToList();
            yield return BuildSpecialLine('│', '│', '│', values, columnsLength);

            if (separateRows && i < _columns[0].Values.Length - 1)
                yield return BuildLine('├', '┼', '┤', columnsLength);
        }

        yield return BuildLine('└', '┴', '┘', columnsLength);
    }

    private IEnumerable<string> BuildHeaderRows(List<int> columnsLength)
    {
        if (separateRows)
        {
            yield return BuildLine('╔', '╦', '╗', columnsLength, '═');
            yield return BuildSpecialLine('║', '║', '║', _columns.Select(c => c.Title).ToList(), columnsLength);
            yield return BuildLine('╠', '╬', '╣', columnsLength, '═');
        }
        else
        {
            yield return BuildLine('┌', '┬', '┐', columnsLength);
            yield return BuildSpecialLine('│', '│', '│', _columns.Select(c => c.Title).ToList(), columnsLength);
            yield return BuildLine('├', '┼', '┤', columnsLength);
        }
    }

    private List<int> GetMaxColumnsLength() =>
        _columns.Select(c => Math.Max(c.Title.Length, c.Values.Max(v => v.Length))).ToList();

    private string BuildLine(char left, char middle, char right, List<int> columnsLength, char separator = '─')
    {
        var sb = new StringBuilder();
        sb.Append(left);
        for (var i = 0; i < _columns.Count; i++)
        {
            sb.Append(separator.ToString().PadRight(columnsLength[i] + 2, separator));
            if (i < _columns.Count - 1)
                sb.Append(middle);
        }

        sb.Append(right);
        return sb.ToString();
    }

    private string BuildSpecialLine(char left, char middle, char right, List<string> values, List<int> columnsLength)
    {
        var sb = new StringBuilder();
        sb.Append(left);
        for (var i = 0; i < _columns.Count; i++)
        {
            sb.Append($" {values.ElementAt(i).PadRight(columnsLength[i])} ");
            if (i < _columns.Count - 1)
                sb.Append(middle);
        }

        sb.Append(right);
        return sb.ToString();
    }

    private record Column
    {
        public required string Title { get; init; }
        public required string[] Values { get; init; }
    }
}