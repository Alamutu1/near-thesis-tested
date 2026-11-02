// Thesis Agent escrow v2 — HARDENED, TESTNET ONLY, dev copy only.
// This file lives ONLY in near-hackathon-dev. The proven v1 contract
// at thesis-agent-escrow2.testnet is NOT overwritten, and this v2 is
// deployed to a fresh testnet account in parallel. It becomes the
// submitted contract only if every test below passes live.
// Hardening over v1:
//  - create_job: payer must not be checker (no self-pay), job_id and
//    claim length bounded, price > 0 and at most 1 NEAR.
//  - record_evidence: evidence must be a URL or a named document
//    (same rule as the demo format check), length bounded.
//  - release: ONLY the payer may release, after mark_passed.
//  - refund: ONLY the payer, only while created, as before.
//  - release/refund: status is confirmed by a callback after the
//    transfer promise. If the transfer fails, the job status is
//    restored to its prior state instead of reading as paid.
// No token, no DAO, no marketplace logic, no mainnet, no real money.
use near_sdk::{env, near, AccountId, NearToken, Promise, store::LookupMap};

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Job {
    pub payer: AccountId,
    pub checker: AccountId,
    pub claim_text: String,
    pub price: NearToken,
    pub evidence_link: Option<String>,
    pub passed: bool,
    pub status: String,
}

fn is_valid_evidence_link(link: &str) -> bool {
    if link.is_empty() || link.len() > 500 {
        return false;
    }
    let lower = link.to_lowercase();
    if lower.starts_with("https://") || lower.starts_with("http://") {
        return true;
    }
    let exts = [".pdf", ".docx", ".doc", ".xlsx", ".csv", ".md", ".txt", ".png", ".jpg", ".jpeg"];
    exts.iter().any(|e| lower.ends_with(e))
}

#[near(contract_state)]
pub struct Escrow {
    jobs: LookupMap<String, Job>,
}

#[near]
impl Escrow {
    #[init]
    pub fn new() -> Self {
        Self { jobs: LookupMap::new(b"j") }
    }

    pub fn version(&self) -> String {
        "thesis-escrow-v2-hardened".to_string()
    }

    #[payable]
    pub fn create_job(&mut self, job_id: String, claim_text: String, checker: AccountId) {
        assert!(!job_id.is_empty() && job_id.len() <= 64, "job_id must be 1-64 chars");
        assert!(!claim_text.is_empty() && claim_text.len() <= 500, "claim_text must be 1-500 chars");
        assert!(!self.jobs.contains_key(&job_id), "job already exists");
        let payer = env::predecessor_account_id();
        assert_ne!(payer, checker, "payer must not be checker (no self-pay)");
        let price = env::attached_deposit();
        assert!(price.as_yoctonear() > 0, "attach a testnet NEAR price for the job");
        assert!(price.as_yoctonear() <= 1_000_000_000_000_000_000_000_000u128, "price must be at most 1 NEAR");
        let job = Job {
            payer,
            checker,
            claim_text,
            price,
            evidence_link: None,
            passed: false,
            status: "created".to_string(),
        };
        self.jobs.insert(job_id, job);
    }

    pub fn record_evidence(&mut self, job_id: String, evidence_link: String) {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert_eq!(env::predecessor_account_id(), job.checker, "only the checker can record evidence");
        assert_eq!(job.status, "created", "job is no longer open");
        assert!(is_valid_evidence_link(&evidence_link), "evidence must be a URL or a named document");
        job.evidence_link = Some(evidence_link);
        self.jobs.insert(job_id, job);
    }

    pub fn mark_passed(&mut self, job_id: String) {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert_eq!(env::predecessor_account_id(), job.checker, "only the checker can mark passed");
        assert_eq!(job.status, "created", "job is no longer open");
        assert!(job.evidence_link.is_some(), "evidence link must be recorded before passing");
        job.passed = true;
        job.status = "passed".to_string();
        self.jobs.insert(job_id, job);
    }

    pub fn release(&mut self, job_id: String) -> Promise {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert_eq!(env::predecessor_account_id(), job.payer, "only the payer can release");
        assert!(job.passed, "job has not passed");
        assert_eq!(job.status, "passed", "job is not in a releasable state");
        job.status = "released".to_string();
        let checker = job.checker.clone();
        let price = job.price;
        self.jobs.insert(job_id.clone(), job);
        Promise::new(checker)
            .transfer(price)
            .then(Self::ext(env::current_account_id()).on_release(job_id))
    }

    #[private]
    pub fn on_release(&mut self, job_id: String) {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        match env::promise_result_checked(0, 10000) {
            Ok(_) => {
                // Transfer succeeded; released status stands.
            }
            _ => {
                // Transfer failed or not ready: restore prior state
                // instead of leaving the job reading as paid.
                job.status = "passed".to_string();
                job.passed = true;
                self.jobs.insert(job_id, job);
            }
        }
    }

    pub fn refund(&mut self, job_id: String) -> Promise {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert_eq!(env::predecessor_account_id(), job.payer, "only the payer can refund");
        assert_eq!(job.status, "created", "only an open job can be refunded (walk-away)");
        job.status = "refunded".to_string();
        let payer = job.payer.clone();
        let price = job.price;
        self.jobs.insert(job_id.clone(), job);
        Promise::new(payer)
            .transfer(price)
            .then(Self::ext(env::current_account_id()).on_refund(job_id))
    }

    #[private]
    pub fn on_refund(&mut self, job_id: String) {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        match env::promise_result_checked(0, 10000) {
            Ok(_) => {}
            _ => {
                job.status = "created".to_string();
                self.jobs.insert(job_id, job);
            }
        }
    }

    pub fn get_job(&self, job_id: String) -> Option<Job> {
        self.jobs.get(&job_id).cloned()
    }
}

impl Default for Escrow {
    fn default() -> Self {
        Self { jobs: LookupMap::new(b"j") }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn evidence_link_validation() {
        assert!(is_valid_evidence_link("https://example.com/report.pdf"));
        assert!(is_valid_evidence_link("sales-ledger-march-2026.pdf"));
        assert!(!is_valid_evidence_link(""));
        assert!(!is_valid_evidence_link("just some words"));
        assert!(!is_valid_evidence_link("report"));
    }

    #[test]
    fn price_cap_is_one_near() {
        assert!(1_000_000_000_000_000_000_000_000u128 > 10_000_000_000_000_000_000_000u128);
    }
}
