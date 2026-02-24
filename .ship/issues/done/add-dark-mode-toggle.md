+++
title = "Add Dark Mode Toggle"
created = "2026-02-22T02:23:47.647378Z"
updated = "2026-02-23T05:06:01.030010Z"
tags = []
links = []
+++

Allow users to switch between light and dark themes in the Settings panel.

Added a Theme control in Settings with Dark/Light options. App now applies theme via CSS variables () and persists user selection in localStorage () so the preference survives restarts. Added light-theme token overrides for app/sidebar/card/background/border/text to switch the full interface style consistently.

Added settings theme selector (dark/light), applied theme via body data attribute, and added light token overrides so the full UI switches themes. Preference is persisted in local storage key ship-ui-theme and restored on startup.
