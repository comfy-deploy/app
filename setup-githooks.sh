#!/bin/sh

# Configure Git to use the hooks from .githooks directory
git config core.hooksPath .githooks

# Run the post-checkout hook to generate the initial file
.githooks/post-checkout

echo "Git hooks setup complete! Branch information will now be tracked automatically."