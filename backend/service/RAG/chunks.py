def isHeading(line: str):
    line = line.strip()
    if not line:
        return False

    max_words = 6
    sentence_ending_char = '.'
    heading_ending_chars = ':*'

    # If line starts with '#' treat as heading
    if line[0] == '#':
        return True
    # If line ends with ':' or '*' treat as heading
    if line[-1] in heading_ending_chars:
        return True
    # If more than max_words, not heading
    if len(line.split()) > max_words:
        return False
    # If ends with a sentence-ending char like '.', not heading
    if line[-1] == sentence_ending_char:
        return False
    return True


def create_chunks(text: str, page_number: int = None, source: str = None) -> list:
    lines = text.split('\n')
    data = []
    current_heading = None
    current_content = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if isHeading(line):
            if current_heading is not None:
                content_str = "\n".join(current_content).strip() if current_content else None
                data.append({
                    "text": {
                        "heading": current_heading,
                        "content": content_str
                    },
                    "meta": {
                        "page": page_number,
                        "source": source
                    }
                })
            current_heading = line.strip("# *")
            current_content = []
        else:
            current_content.append(line)

    if current_heading is not None:
        content_str = "\n".join(current_content).strip() if current_content else None
        data.append({
            "text": {
                "heading": current_heading,
                "content": content_str
            },
            "meta": {
                "page": page_number,
                "source": source
            }
        })

    return data
