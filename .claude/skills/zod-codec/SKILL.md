---
name: zod-codec
description: Guide for correctly using Zod v4 codec functionality. Reference when working with codec definitions, encode/decode usage, and date codecs like dateString/dateWithoutTime. Use when implementing features involving "zod codec", "encode", "decode", "date conversion", "dateString", "dateWithoutTime".
---

# Zod v4 Codec Guide

## Overview

Zod v4 codecs define **bidirectional transformations** between input and output types.

```typescript
z.codec(inputSchema, outputSchema, {
  decode: (input) => output, // Input → Output (forward)
  encode: (output) => input, // Output → Input (backward)
});
```

## ⚠️ Critical: encode/decode Directionality

### Reading Codec Definitions

```typescript
const myCodec = z.codec(
  InputSchema, // 1st arg: Input type
  OutputSchema, // 2nd arg: Output type
  {
    decode: (input: Input) => Output, // Receives Input, returns Output
    encode: (output: Output) => Input, // Receives Output, returns Input
  }
);
```

### Runtime Behavior

| Method           | Input       | Output      | Description                       |
| ---------------- | ----------- | ----------- | --------------------------------- |
| `.decode(value)` | Input type  | Output type | External data → Application       |
| `.encode(value)` | Output type | Input type  | Application → External data       |
| `.parse(value)`  | unknown     | Output type | Same as decode (no type checking) |

## Project Codecs

### dateWithoutTime (Date ↔ ISO date string)

```typescript
// Definition: packages/domain/src/value-object/date-without-time.vo.ts
const schema = z.codec(z.date(), z.iso.date(), {
  decode: (date: Date) => format(date, 'yyyy-MM-dd'), // Date → string
  encode: (value: string) => new Date(`${value}T00:00:00.000Z`), // string → Date
});

// Input: Date, Output: string (ISO date)
```

**Usage:**

```typescript
// ❌ Wrong: Redundant new Date() on already Date value
const date = new Date();
dateWithoutTime.schema.decode(new Date(date));

// ✅ Correct: Pass Date directly
const date = new Date();
dateWithoutTime.schema.decode(date); // → "2024-01-15"

// ❌ Wrong: Redundant format() on already string result
const isoString = '2024-01-15';
format(dateWithoutTime.schema.encode(isoString), 'yyyy-MM-dd');

// ✅ Correct: encode returns Date directly
const isoString = '2024-01-15';
dateWithoutTime.schema.encode(isoString); // → Date
```

### dateStringVo (Date ↔ ISO datetime string)

```typescript
// Definition: packages/domain/src/value-object/date-string.vo.ts
const schema = z.codec(z.date(), z.iso.datetime(), {
  decode: (date) => date.toISOString(), // Date → ISO string
  encode: (isoString) => new Date(isoString), // ISO string → Date
});

// Input: Date, Output: string (ISO datetime)
```

**Usage:**

```typescript
// ❌ Wrong: encode already returns Date
const isoString = '2024-01-15T10:30:00.000Z';
new Date(dateStringVo.schema.encode(isoString));

// ✅ Correct: encode result is already Date
const isoString = '2024-01-15T10:30:00.000Z';
dateStringVo.schema.encode(isoString); // → Date
```

## Common Mistakes

### 1. Redundant Conversion on Already-Converted Values

```typescript
// ❌ Redundant new Date() on already Date
const date = new Date();
schema.decode(new Date(date));

// ❌ Redundant format() on already string
const str = '2024-01-15';
format(schema.encode(str), 'yyyy-MM-dd');

// ❌ Redundant .toISOString() on already Date
const date = new Date();
schema.decode(date.toISOString());
```

### 2. Wrong encode/decode Direction

```typescript
// Always check codec definition first:
// z.codec(InputSchema, OutputSchema, { decode, encode })

// decode: Input → Output
// encode: Output → Input

// DB → Entity conversion (external data → app)
// → Usually use encode (DB format is Input, Entity format is Output)

// Entity → DB conversion (app → external data)
// → Usually use decode (Entity format is Input, DB format is Output)
```

### 3. Using Without Checking Types

```typescript
// ❌ Using without checking types
const result = schema.encode(value);
new Date(result); // result might already be Date

// ✅ Check codec definition first
// schema = z.codec(z.date(), z.string(), ...)
// encode: string → Date, so result is Date
const result = schema.encode(value); // Date type
```

## Decision Flowchart

### Which Method to Use?

1. **Check codec definition**: `z.codec(InputSchema, OutputSchema, ...)`
2. **Check current value type**: What type do you have?
3. **Check desired result type**: What type do you need?

| Current Value | Desired Result | Method      |
| ------------- | -------------- | ----------- |
| Input type    | Output type    | `.decode()` |
| Output type   | Input type     | `.encode()` |

## Nested Codecs

Codecs can be nested inside objects:

```typescript
const payloadSchema = z.object({
  startDate: dateWithoutTime.schema,
  endDate: dateWithoutTime.schema,
});

// decode/encode the entire object
payloadSchema.decode({ startDate: new Date(), endDate: new Date() });
// → { startDate: "2024-01-15", endDate: "2024-01-16" }

payloadSchema.encode({ startDate: '2024-01-15', endDate: '2024-01-16' });
// → { startDate: Date, endDate: Date }
```

## Reference: Standard Codec Patterns

```typescript
// ISO datetime string ↔ Date
const isoDatetimeToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString), // string → Date
  encode: (date) => date.toISOString(), // Date → string
});

// Unix timestamp (seconds) ↔ Date
const epochSecondsToDate = z.codec(z.int().min(0), z.date(), {
  decode: (seconds) => new Date(seconds * 1000),
  encode: (date) => Math.floor(date.getTime() / 1000),
});

// string ↔ number
const stringToNumber = z.codec(z.string(), z.number(), {
  decode: (str) => Number.parseFloat(str),
  encode: (num) => num.toString(),
});
```

## Key Takeaways

1. **Always check the codec definition** before using encode/decode
2. **Input type** is the first argument, **Output type** is the second
3. **decode**: Input → Output (forward direction)
4. **encode**: Output → Input (backward direction)
5. **Never double-convert**: If result is already the desired type, don't convert again
