"""
Unit Tests for Multi-Turn Conversation Memory, Intent Resolution, and Continuation
"""

import re
import unittest


class TestChatMemoryAndContinuation(unittest.TestCase):
    """Test suite for conversation history preservation, continuation prompts, and markdown formatting."""

    def test_continuation_intent_regex(self):
        """Verify continuation keywords are reliably detected."""
        continuation_patterns = re.compile(r"^(continue|go on|proceed|next|keep going|more|continue generating|continue response)\b", re.IGNORECASE)

        valid_continuations = [
            "continue",
            "Continue",
            "continue generating",
            "go on",
            "proceed with module 2",
            "next",
            "keep going please",
            "more"
        ]
        for phrase in valid_continuations:
            self.assertTrue(bool(continuation_patterns.search(phrase)), f"Phrase '{phrase}' should match continuation intent")

        non_continuations = [
            "Explain Python decorators",
            "What is a Kubernetes Pod?",
            "Build a react app",
            "Who are you?"
        ]
        for phrase in non_continuations:
            self.assertFalse(bool(continuation_patterns.search(phrase)), f"Phrase '{phrase}' should NOT match continuation intent")

    def test_code_block_auto_closing_logic(self):
        """Verify unclosed code blocks are auto-closed during streaming or token cutoff."""
        def auto_close_codeblocks(text: str) -> str:
            count = len(re.findall(r"```", text))
            if count % 2 != 0:
                return text + "\n```"
            return text

        # Truncated response ending mid-code
        truncated = "Here is the code:\n```python\ndef calculate_sum(a, b):\n    return a + b"
        repaired = auto_close_codeblocks(truncated)
        self.assertTrue(repaired.endswith("\n```"), "Truncated code block must be auto-closed with triple backticks")

        # Properly closed response
        proper = "Here is the code:\n```python\ndef calculate_sum(a, b):\n    return a + b\n```\nAll done!"
        unchanged = auto_close_codeblocks(proper)
        self.assertEqual(unchanged, proper, "Properly closed code blocks should remain untouched")

    def test_chat_history_sliding_window(self):
        """Verify chat history bounds to prevent context window bloat."""
        history = []
        max_history_turns = 16

        # Simulate 20 back-and-forth turns
        for i in range(20):
            history.append({"role": "user", "content": f"User prompt {i}"})
            history.append({"role": "assistant", "content": f"Assistant response {i}"})
            if len(history) > max_history_turns:
                history = history[-max_history_turns:]

        self.assertEqual(len(history), max_history_turns, "History length must be bounded to max_history_turns")
        self.assertEqual(history[-1]["content"], "Assistant response 19")
        self.assertEqual(history[-2]["content"], "User prompt 19")

    def test_multi_turn_payload_construction(self):
        """Verify system prompt, conversation turns, and continuation prompt are layered correctly."""
        system_prompt = "You are OmniStudio Technical Specialist."
        history = [
            {"role": "user", "content": "Explain AWS VPC subnets."},
            {"role": "assistant", "content": "AWS VPC subnets can be Public or Private..."}
        ]
        followup_user_prompt = "continue"
        
        is_continuation = True
        continuation_instruction = "Please seamlessly continue generating from the exact cutoff point without repeating earlier text."

        messages = [{"role": "system", "content": system_prompt}]
        for turn in history:
            messages.append(turn)
        
        if is_continuation:
            messages.append({"role": "user", "content": continuation_instruction})
        else:
            messages.append({"role": "user", "content": followup_user_prompt})

        self.assertEqual(len(messages), 4)
        self.assertEqual(messages[0]["role"], "system")
        self.assertEqual(messages[1]["content"], "Explain AWS VPC subnets.")
        self.assertEqual(messages[2]["role"], "assistant")
        self.assertEqual(messages[3]["content"], continuation_instruction)


if __name__ == "__main__":
    unittest.main()
