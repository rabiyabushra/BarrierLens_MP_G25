"""Export Stage 1 model comparison CSV to dashboard JSON.

Reads existing CSV files (stage1_model_comparison.csv, logistic_results.csv,
train_test_accuracy.csv) and merges them into a single JSON for the
presentation deck. No hand-typed values — all data comes from the CSVs.
"""

import csv
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Primary source: the full model comparison table
STAGE1_CSV = os.path.join(BASE, "data", "dashboard", "powerbi", "stage1_model_comparison.csv")
LOGISTIC_CSV = os.path.join(BASE, "outputs", "stage1_results", "logistic_results.csv")
TRAIN_TEST_CSV = os.path.join(BASE, "outputs", "stage1_results", "train_test_accuracy.csv")
OUT_JSON = os.path.join(BASE, "dashboard", "assets", "data", "stage1_model_comparison.json")


def read_csv(path):
    rows = []
    if not os.path.exists(path):
        return rows
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def safe_float(val):
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def main():
    # 1. Read primary stage1 model comparison
    stage1_rows = read_csv(STAGE1_CSV)
    # 2. Read logistic-only results (has CV AUC)
    logistic_rows = read_csv(LOGISTIC_CSV)
    # 3. Read train/test accuracy
    tt_rows = read_csv(TRAIN_TEST_CSV)

    # Build train-test lookup
    tt_lookup = {}
    for r in tt_rows:
        key = (r.get("Model", "").strip(), r.get("Target", "").strip())
        tt_lookup[key] = {
            "train_accuracy": safe_float(r.get("Train Accuracy")),
            "test_accuracy": safe_float(r.get("Test Accuracy")),
        }

    # Build logistic CV lookup
    lr_lookup = {}
    for r in logistic_rows:
        key = r.get("Target", "").strip()
        lr_lookup[key] = {
            "cv_auc_mean": safe_float(r.get("CV AUC Mean")),
            "cv_auc_std": safe_float(r.get("CV AUC Std")),
        }

    # Normalise target names
    target_map = {
        "Health Health Facility Barrier": "facility",
        "Household Barrier": "household",
        "Logistical Barrier": "logistic",
    }

    models = []
    for r in stage1_rows:
        model_name = r.get("Model", "").strip()
        raw_target = r.get("Target", "").strip()
        target_key = target_map.get(raw_target, raw_target)

        entry = {
            "model": model_name,
            "target": target_key,
            "target_label": raw_target,
            "accuracy": safe_float(r.get("Accuracy")),
            "roc_auc": safe_float(r.get("ROC-AUC")),
            "precision": safe_float(r.get("Precision")),
            "recall": safe_float(r.get("Recall")),
            "f1_score": safe_float(r.get("F1-Score")),
        }

        # Merge train/test accuracy
        tt_key = (model_name, target_key)
        if tt_key in tt_lookup:
            entry.update(tt_lookup[tt_key])

        # Merge CV AUC for Logistic Regression
        if model_name == "Logistic Regression" and target_key in lr_lookup:
            entry.update(lr_lookup[target_key])

        models.append(entry)

    output = {
        "metadata": {
            "title": "Stage 1 Model Comparison (All Barriers × All Models)",
            "source_files": [
                "data/dashboard/powerbi/stage1_model_comparison.csv",
                "outputs/stage1_results/logistic_results.csv",
                "outputs/stage1_results/train_test_accuracy.csv",
            ],
            "models": sorted(set(m["model"] for m in models)),
            "targets": sorted(set(m["target"] for m in models)),
        },
        "models": models,
    }

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"Wrote {len(models)} model entries to {OUT_JSON}")


if __name__ == "__main__":
    main()
