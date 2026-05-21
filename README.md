# Inferring Joint Commitment from Observed Coordination

This repository contains the code, experiment materials, and analysis for the CogSci proceedings paper:

> **Inferring Joint Commitment from Observed Coordination**  
> Jinyi Kuang, Erik Brockbank, Cristina Bicchieri, & Robert D. Hawkins

The project investigates how observers infer **joint commitment** from repeated coordination behavior using a Gridworld task and a Bayesian Theory of Mind framework. Participants observed pairs of agents coordinating in a spatial environment and inferred the extent to which the agents were acting as a committed “we.” :contentReference[oaicite:0]{index=0}

---

## Citation

Kuang, J., Brockbank, E., Bicchieri, C., & Hawkins, R. (2026). Inferring joint commitment from observed coordination. In *Proceedings of the 48th Annual Meeting of the Cognitive Science Society*. 

### Abstract

Successful social life requires agents to accurately perceive social bonds and infer whether interacting partners are committed to a shared goal. This project introduces a computational model of commitment inference based on Bayesian Theory of Mind and evaluates it in a series of Gridworld coordination experiments. Across two experiments (`N = 785`), observers inferred stronger commitment when coordination involved payoff interdependence and repeated successful cooperation. :contentReference[oaicite:2]{index=2}

---

# Repository Structure

```text
gridworld_exp/
├── Analysis/              # Statistical analyses and model fitting
├── Exp1/                  # Experiment 1 (joint-location coordination)
│   ├── assets/
│   ├── css/
│   ├── js/
│   ├── trials/
│   └── index.html
├── Exp2/                  # Experiment 2 (parallel coordination)
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── index.html
└── Pre-registration/      # AsPredicted preregistrations
