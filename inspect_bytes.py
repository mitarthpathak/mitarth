import sys

with open(r'd:/portfolio- claude/app/components/SignatureAnimation.js', 'rb') as f:
    raw = f.read()

print('Total bytes:', len(raw))
print('First 4 bytes:', raw[:4].hex())

# Find all non-UTF8 sequences
errors = []
i = 0
while i < len(raw):
    b = raw[i]
    try:
        if b < 0x80:
            i += 1
        elif b < 0xC0:
            errors.append((i, b))
            i += 1
        elif b < 0xE0:
            i += 2
        elif b < 0xF0:
            i += 3
        else:
            i += 4
    except:
        errors.append((i, b))
        i += 1

print('Invalid UTF-8 bytes at:', errors[:10])
