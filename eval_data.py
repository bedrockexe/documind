# eval_data.py
# Golden set for RAG evaluation over the Cross-Layer Network Diagnostic proposal.
# Ground truths are pulled directly from the PDF. Skim to confirm they match
# what you'd accept as a correct answer, then we wire up RAGAS.

EVAL_SET = [
    {
        "question": "What problem does the paper address?",
        "ground_truth": (
            "Non-technical end-users cannot identify the actual cause of poor LAN "
            "performance. Common internet speed-test tools measure end-to-end "
            "performance but cannot trace a bottleneck to its source, so users can't "
            "tell whether slowness comes from the ISP, local wireless/router "
            "interference, or their own device hardware. The paper addresses the lack "
            "of an accessible, lightweight tool that isolates the specific cause."
        ),
    },
    {
        "question": "What approach does the proposed system use to diagnose bottlenecks?",
        "ground_truth": (
            "A cross-layer heuristic rule-based inference engine (an expert system) "
            "that simulates a human network technician's reasoning. Instead of machine "
            "learning, it applies predefined IF-THEN rules to correlate telemetry from "
            "several network layers to classify the root cause of degradation."
        ),
    },
    {
        "question": "What three categories does the system classify network bottlenecks into?",
        "ground_truth": (
            "(1) Internet Service Provider (ISP) limitation, (2) local wireless or "
            "router interference, and (3) local hardware constraint."
        ),
    },
    {
        "question": "What telemetry metrics does the system extract, and from which layers?",
        "ground_truth": (
            "Physical-layer WiFi signal strength as RSSI (in dBm); network-layer "
            "latency from ICMP ping tests to both the local gateway and an external "
            "server; and hardware CPU utilization on the client device (plus network "
            "interface throughput)."
        ),
    },
    {
        "question": "What RSSI value does the system treat as a weak wireless signal?",
        "ground_truth": (
            "An RSSI below -70 dBm is considered weak, indicating possible wireless "
            "interference or excessive distance between the client device and the "
            "access point."
        ),
    },
    {
        "question": "What metrics will be used to evaluate the system?",
        "ground_truth": (
            "Accuracy, precision, recall, F1-score, and a confusion matrix. Results "
            "are validated statistically using mean accuracy and standard deviation "
            "across at least 30 trials per scenario, compared against a 33% "
            "random-classification baseline for three classes."
        ),
    },
]