CREATE TRIGGER entry_safe_aggregate BEFORE INSERT ON entries WHEN NEW.amount>0 BEGIN
SELECT CASE WHEN (SELECT COALESCE(SUM(CASE WHEN amount>0 THEN amount ELSE 0 END),0) FROM entries WHERE tenant=NEW.tenant)+NEW.amount>9007199254740991 THEN RAISE(ABORT,'Organization ledger exceeds supported exact arithmetic range') END;
END;
